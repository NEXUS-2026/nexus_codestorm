import base64
import json
import os
import cv2
import numpy as np
from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
from flask_sock import Sock
from dotenv import load_dotenv

load_dotenv()

from database import (
    create_session, end_session, get_session,
    list_sessions, log_detection, get_logs_for_session,
    get_operator_stats,
)
from video_recorder import VideoRecorder
from pdf_generator import generate_challan

app = Flask(__name__)
CORS(app)
sock = Sock(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "best.pt")
FRAME_WIDTH  = 640
FRAME_HEIGHT = 480
LOG_EVERY_N  = 30


# ── Health ────────────────────────────────────────────────────
@app.route("/health")
def health():
    return jsonify({"status": "ok"})


# ── Sessions ──────────────────────────────────────────────────
@app.route("/sessions")
def get_sessions():
    return jsonify(list_sessions())


@app.route("/sessions/<session_id>")
def get_session_detail(session_id):
    session = get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    return jsonify(session)


@app.route("/sessions/<session_id>/logs")
def get_session_logs(session_id):
    return jsonify(get_logs_for_session(session_id))


@app.route("/sessions/<session_id>/challan", methods=["POST"])
def download_challan(session_id):
    session = get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    logs = get_logs_for_session(session_id)
    pdf_path = generate_challan(session, logs)
    return send_file(pdf_path, mimetype="application/pdf",
                     as_attachment=True,
                     download_name=os.path.basename(pdf_path))


@app.route("/stats/operators")
def operator_stats():
    return jsonify(get_operator_stats())


# ── WebSocket — live stream ───────────────────────────────────
@sock.route("/ws/stream")
def websocket_stream(ws):
    # First message: {"action":"start","batch_id":"...","operator_id":"...","camera_index":0}
    try:
        init = json.loads(ws.receive())
    except Exception:
        return

    batch_id     = init.get("batch_id", "BATCH-001")
    operator_id  = init.get("operator_id", "OP-001")
    camera_index = int(init.get("camera_index", 0))

    session_id = create_session(batch_id, operator_id)

    # Load YOLO counter if model exists
    counter = None
    try:
        from detection import BoxCounter
        counter = BoxCounter(MODEL_PATH)
    except Exception as e:
        print(f"[WARN] No model loaded: {e}")

    recorder = VideoRecorder(session_id, fps=10, resolution=(FRAME_WIDTH, FRAME_HEIGHT))

    cap = cv2.VideoCapture(camera_index)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

    if not cap.isOpened():
        ws.send(json.dumps({"error": "Cannot open camera"}))
        end_session(session_id, 0, None)
        return

    frame_num = 0
    count = 0
    running = True

    try:
        while running and ws.connected:
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.resize(frame, (FRAME_WIDTH, FRAME_HEIGHT))

            if counter:
                count, confidences = counter.process_frame(frame)
                frame = counter.draw_overlay(frame, count)
                frame_num += 1
                if frame_num % LOG_EVERY_N == 0:
                    avg_conf = float(np.mean(confidences)) if confidences else 0.0
                    log_detection(session_id, count, avg_conf)
            else:
                cv2.putText(frame, "Waiting for model...", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

            recorder.write(frame)

            _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            ws.send(json.dumps({
                "frame": base64.b64encode(buf).decode(),
                "count": count,
                "session_active": True,
                "session_id": session_id,
            }))

    except Exception as e:
        print(f"[WS] Stream ended: {e}")
    finally:
        cap.release()
        video_path = recorder.stop()
        end_session(session_id, count, video_path)
        try:
            ws.send(json.dumps({
                "frame": "", "count": count,
                "session_active": False,
                "session_id": session_id,
            }))
        except Exception:
            pass


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

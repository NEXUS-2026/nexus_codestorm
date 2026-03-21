import base64
import json
import os
import re
import cv2
import numpy as np
from flask import Flask, jsonify, send_file, request, Response
from flask_cors import CORS
from flask_sock import Sock
from dotenv import load_dotenv

load_dotenv()

from database import (
    create_session, end_session, get_session,
    list_sessions, log_detection, get_logs_for_session,
    get_operator_stats, delete_session, batch_id_exists,
)

# Try to import auth module, but don't fail if dependencies are missing
try:
    from auth import create_user, login_user, verify_token, get_user_by_id
    AUTH_ENABLED = True
    print("[main] ✓ Authentication module loaded successfully")
except ImportError as e:
    AUTH_ENABLED = False
    print(f"[main] ⚠ Authentication disabled - missing dependencies: {e}")
    print("[main] Run: pip install bcrypt pyjwt")

from video_recorder import VideoRecorder
from pdf_generator import generate_challan
from detection import BoxCounter


# ── Authentication Middleware ─────────────────────────────────
def get_current_user_id():
    """Extract user_id from JWT token in Authorization header."""
    if not AUTH_ENABLED:
        return None
    
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.replace("Bearer ", "")
    try:
        payload = verify_token(token)
        return payload.get("user_id")
    except:
        return None


def require_auth():
    """Decorator to require authentication for routes."""
    if not AUTH_ENABLED:
        return jsonify({"error": "Authentication not enabled"}), 503
    
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    return None  # Auth successful

app = Flask(__name__)

# Configure CORS with explicit settings
CORS(app, 
     resources={r"/*": {
         "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
         "methods": ["GET", "POST", "DELETE", "OPTIONS", "PUT", "PATCH"],
         "allow_headers": ["Content-Type", "Authorization"],
         "expose_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True,
         "max_age": 3600
     }})

# Add after_request handler for additional CORS headers
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

sock = Sock(app)

MODEL_PATH   = os.path.join(os.path.dirname(__file__), os.getenv("MODEL_PATH", "models/best.pt"))
FRAME_WIDTH  = 640
FRAME_HEIGHT = 480
LOG_EVERY_N  = 30

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load YOLO model once at startup
print(f"[main] MODEL_PATH resolved to: {MODEL_PATH}")
print(f"[main] File exists: {os.path.exists(MODEL_PATH)}")
try:
    _counter = BoxCounter(MODEL_PATH)
    print("[main] YOLO model loaded successfully")
except Exception as e:
    import traceback
    _counter = None
    print(f"[main] WARN: Could not load model: {e}")
    traceback.print_exc()

# Batch ID: uppercase WORD-NUMBER, e.g. BATCH-001, WH-42
BATCH_ID_RE = re.compile(r"^[A-Z][A-Z0-9]*-\d+$")

def _validate_batch_id(batch_id: str):
    if not batch_id:
        return "Batch ID is required."
    if not BATCH_ID_RE.match(batch_id):
        return "Batch ID must be uppercase in format WORD-NUMBER (e.g. BATCH-001)."
    if batch_id_exists(batch_id):
        return f"Batch ID '{batch_id}' already exists. Use a unique batch ID."
    return None


# ── Health ────────────────────────────────────────────────────
@app.route("/")
def index():
    return jsonify({"status": "ok", "message": "WAREgaurd API is running"})

@app.route("/health")
def health():
    return jsonify({"status": "ok"})


# ── Authentication ────────────────────────────────────────────
@app.route("/auth/signup", methods=["POST", "OPTIONS"])
def signup():
    print(f"[signup] Received {request.method} request")
    print(f"[signup] Headers: {dict(request.headers)}")
    
    # Handle preflight request
    if request.method == "OPTIONS":
        print("[signup] Handling OPTIONS preflight")
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 200
    
    print("[signup] Handling POST request")
    
    if not AUTH_ENABLED:
        print("[signup] Auth not enabled")
        return jsonify({"success": False, "error": "Authentication module not available. Install bcrypt and pyjwt."}), 503
    
    try:
        data = request.get_json() or {}
        print(f"[signup] Received data: {data}")
        
        email = data.get("email", "").strip()
        password = data.get("password", "")
        warehouse_name = data.get("warehouse_name", "").strip()
        warehouse_location = data.get("warehouse_location", "").strip()
        contact_name = data.get("contact_name", "").strip()
        contact_phone = data.get("contact_phone", "").strip()
        
        print(f"[signup] Creating user: {email}")
        success, message, user_data = create_user(
            email, password, warehouse_name, warehouse_location,
            contact_name, contact_phone
        )
        
        if success:
            print(f"[signup] User created successfully: {email}")
            return jsonify({"success": True, "message": message, "user": user_data}), 201
        else:
            print(f"[signup] User creation failed: {message}")
            return jsonify({"success": False, "error": message}), 400
    except Exception as e:
        print(f"[signup] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/auth/login", methods=["POST", "OPTIONS"])
def login():
    # Handle preflight request
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 200
    
    if not AUTH_ENABLED:
        return jsonify({"success": False, "error": "Authentication module not available. Install bcrypt and pyjwt."}), 503
    
    try:
        data = request.get_json() or {}
        
        email = data.get("email", "").strip()
        password = data.get("password", "")
        
        if not email or not password:
            return jsonify({"success": False, "error": "Email and password are required"}), 400
        
        success, message, user_data = login_user(email, password)
        
        if success:
            return jsonify({"success": True, "message": message, "user": user_data}), 200
        else:
            return jsonify({"success": False, "error": message}), 401
    except Exception as e:
        print(f"[login] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/auth/verify", methods=["GET", "OPTIONS"])
def verify():
    """Verify JWT token and return user data"""
    # Handle preflight request
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response, 200
    
    if not AUTH_ENABLED:
        return jsonify({"success": False, "error": "Authentication module not available"}), 503
    
    try:
        auth_header = request.headers.get("Authorization", "")
        
        if not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "error": "No token provided"}), 401
        
        token = auth_header.replace("Bearer ", "")
        
        payload = verify_token(token)
        user = get_user_by_id(payload["user_id"])
        
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        return jsonify({"success": True, "user": user}), 200
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 401
    except Exception as e:
        print(f"[verify] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/auth/me", methods=["GET", "OPTIONS"])
def get_current_user():
    """Get current user profile"""
    # Handle preflight request
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response, 200
    
    if not AUTH_ENABLED:
        return jsonify({"success": False, "error": "Authentication module not available"}), 503
    
    try:
        auth_header = request.headers.get("Authorization", "")
        
        if not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "error": "No token provided"}), 401
        
        token = auth_header.replace("Bearer ", "")
        
        payload = verify_token(token)
        user = get_user_by_id(payload["user_id"])
        
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        return jsonify({"success": True, "user": user}), 200
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 401
    except Exception as e:
        print(f"[get_current_user] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# ── Batch ID validation ───────────────────────────────────────
@app.route("/validate/batch", methods=["POST"])
def validate_batch():
    user_id = get_current_user_id()
    data = request.get_json() or {}
    batch_id = (data.get("batch_id") or "").strip().upper()
    
    if not batch_id:
        return jsonify({"valid": False, "error": "Batch ID is required."}), 400
    
    if not BATCH_ID_RE.match(batch_id):
        return jsonify({"valid": False, "error": "Batch ID must be uppercase in format WORD-NUMBER (e.g. BATCH-001)."}), 400
    
    # Check if batch_id exists for this user
    if batch_id_exists(batch_id, user_id):
        return jsonify({"valid": False, "error": f"Batch ID '{batch_id}' already exists. Use a unique batch ID."}), 400
    
    return jsonify({"valid": True})


# ── Sessions ──────────────────────────────────────────────────
@app.route("/sessions")
def get_sessions():
    """Get all sessions for the authenticated user."""
    user_id = get_current_user_id()
    return jsonify(list_sessions(user_id))


@app.route("/sessions/<session_id>", methods=["GET", "DELETE"])
def session_detail(session_id):
    """Get or delete a specific session (user-scoped)."""
    user_id = get_current_user_id()
    session = get_session(session_id, user_id)
    
    if not session:
        return jsonify({"error": "Session not found"}), 404

    if request.method == "GET":
        return jsonify(session)

    # DELETE
    if session.get("video_path") and os.path.exists(session["video_path"]):
        try: os.remove(session["video_path"])
        except Exception: pass

    challan_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "challans", f"challan_{session_id}.pdf")
    )
    if os.path.exists(challan_path):
        try: os.remove(challan_path)
        except Exception: pass

    delete_session(session_id, user_id)
    return jsonify({"deleted": session_id})


@app.route("/sessions/<session_id>/logs")
def get_session_logs(session_id):
    """Get logs for a specific session (user-scoped)."""
    user_id = get_current_user_id()
    session = get_session(session_id, user_id)
    
    if not session:
        return jsonify({"error": "Session not found"}), 404
    
    return jsonify(get_logs_for_session(session_id))


@app.route("/sessions/<session_id>/challan", methods=["POST"])
def download_challan(session_id):
    """Generate and download challan for a session (user-scoped)."""
    user_id = get_current_user_id()
    session = get_session(session_id, user_id)
    
    if not session:
        return jsonify({"error": "Session not found"}), 404
    
    logs = get_logs_for_session(session_id)
    pdf_path = generate_challan(session, logs)
    return send_file(pdf_path, mimetype="application/pdf",
                     as_attachment=True,
                     download_name=os.path.basename(pdf_path))


@app.route("/stats/operators")
def operator_stats():
    """Get operator statistics for the authenticated user."""
    user_id = get_current_user_id()
    return jsonify(get_operator_stats(user_id))


# ── Upload video ──────────────────────────────────────────────
@app.route("/upload", methods=["POST"])
def upload_video():
    if "video" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["video"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    save_path = os.path.abspath(os.path.join(UPLOAD_DIR, file.filename))
    file.save(save_path)
    return jsonify({"path": save_path})


# ── Video serving with range support ─────────────────────────
def serve_video(path):
    ext = os.path.splitext(path)[1].lower().lstrip(".")
    mimetype = {"mp4": "video/mp4", "avi": "video/x-msvideo"}.get(ext, "video/octet-stream")
    file_size = os.path.getsize(path)
    range_header = request.headers.get("Range")

    if range_header:
        byte_range = range_header.replace("bytes=", "").split("-")
        start = int(byte_range[0])
        end = int(byte_range[1]) if byte_range[1] else file_size - 1
        length = end - start + 1
        with open(path, "rb") as f:
            f.seek(start)
            data = f.read(length)
        resp = Response(data, 206, mimetype=mimetype, direct_passthrough=True)
        resp.headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
        resp.headers["Accept-Ranges"] = "bytes"
        resp.headers["Content-Length"] = str(length)
        return resp

    resp = Response(open(path, "rb").read(), 200, mimetype=mimetype)
    resp.headers["Accept-Ranges"] = "bytes"
    resp.headers["Content-Length"] = str(file_size)
    return resp


def _mjpeg_stream(path):
    """Stream any video file as MJPEG — works in all browsers regardless of codec.
    Accepts ?speed=0.5|1|1.5|2 query param to control playback rate."""
    try:
        speed = float(request.args.get("speed", 1))
        speed = max(0.25, min(speed, 4.0))  # clamp to sane range
    except (ValueError, TypeError):
        speed = 1.0

    def generate():
        cap = cv2.VideoCapture(path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 10
        # delay between frames in seconds, adjusted by speed
        delay = 1.0 / (fps * speed)
        import time
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" +
                    buf.tobytes() +
                    b"\r\n"
                )
                time.sleep(delay)
        finally:
            cap.release()
    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")


@app.route("/sessions/<session_id>/video")
def session_video(session_id):
    """Serve video for a session (user-scoped)."""
    user_id = get_current_user_id()
    session = get_session(session_id, user_id)
    
    if not session or not session.get("video_path"):
        return jsonify({"error": "Video not found"}), 404
    
    path = session["video_path"]
    if not os.path.exists(path):
        return jsonify({"error": "Video file missing"}), 404
    
    return serve_video(path)

@app.route("/sessions/<session_id>/video/stream")
def session_video_stream(session_id):
    """Stream video for a session (user-scoped)."""
    user_id = get_current_user_id()
    session = get_session(session_id, user_id)
    
    if not session or not session.get("video_path"):
        return jsonify({"error": "Video not found"}), 404
    
    path = session["video_path"]
    if not os.path.exists(path):
        return jsonify({"error": "Video file missing"}), 404
    
    return _mjpeg_stream(path)


@app.route("/sessions/<session_id>/upload")
def session_upload(session_id):
    """Serve uploaded file for a session (user-scoped)."""
    user_id = get_current_user_id()
    session = get_session(session_id, user_id)
    
    if not session or not session.get("upload_path"):
        return jsonify({"error": "No uploaded file for this session"}), 404
    
    path = session["upload_path"]
    if not os.path.exists(path):
        return jsonify({"error": "Uploaded file missing"}), 404
    
    return serve_video(path)

@app.route("/sessions/<session_id>/upload/stream")
def session_upload_stream(session_id):
    """Stream uploaded file for a session (user-scoped)."""
    user_id = get_current_user_id()
    session = get_session(session_id, user_id)
    
    if not session or not session.get("upload_path"):
        return jsonify({"error": "No uploaded file for this session"}), 404
    
    path = session["upload_path"]
    if not os.path.exists(path):
        return jsonify({"error": "Uploaded file missing"}), 404
    
    return _mjpeg_stream(path)


# ── WebSocket — live stream ───────────────────────────────────
@sock.route("/ws/stream")
def websocket_stream(ws):
    try:
        init = json.loads(ws.receive())
    except Exception:
        return

    if init.get("action") != "start":
        ws.send(json.dumps({"error": "First message must have action=start"}))
        return

    batch_id     = (init.get("batch_id") or "").strip().upper()
    operator_id  = (init.get("operator_id") or "").strip()
    camera_index = int(init.get("camera_index", 0))
    video_path   = init.get("video_path", None)
    confidence   = float(init.get("confidence", 0.35))  # Default 35% if not provided
    user_id      = init.get("user_id", None)  # Get user_id from WebSocket init message

    # Validate batch_id format
    if not batch_id:
        ws.send(json.dumps({"error": "Batch ID is required."}))
        return
    
    if not BATCH_ID_RE.match(batch_id):
        ws.send(json.dumps({"error": "Batch ID must be uppercase in format WORD-NUMBER (e.g. BATCH-001)."}))
        return
    
    # Check if batch_id already exists for this user
    if batch_id_exists(batch_id, user_id):
        ws.send(json.dumps({"error": f"Batch ID '{batch_id}' already exists. Use a unique batch ID."}))
        return

    source_type = "upload" if video_path else "live"
    session_id  = create_session(batch_id, operator_id, user_id, source_type, video_path)

    # Create a new counter instance for this session with the specified confidence
    counter = None
    if _counter:
        try:
            counter = BoxCounter(MODEL_PATH)
            counter.set_confidence(confidence)
        except Exception as e:
            print(f"[WS] Failed to create counter: {e}")
    
    recorder = VideoRecorder(session_id, fps=10, resolution=(FRAME_WIDTH, FRAME_HEIGHT))

    source = video_path if video_path else camera_index
    cap = cv2.VideoCapture(source)
    if not video_path:
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

    if not cap.isOpened():
        ws.send(json.dumps({"error": "Cannot open video source"}))
        end_session(session_id, 0, None)
        return

    ws.send(json.dumps({"session_id": session_id, "session_active": True, "count": 0, "frame": ""}))

    frame_num = 0
    count     = 0
    max_count = 0  # Track maximum count reached during session

    try:
        while ws.connected:
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.resize(frame, (FRAME_WIDTH, FRAME_HEIGHT))

            if counter:
                count, confidences = counter.process_frame(frame)
                max_count = max(max_count, count)  # Update max count
                frame = counter.draw_overlay(frame, count)
                frame_num += 1
                if frame_num % LOG_EVERY_N == 0:
                    avg_conf = float(np.mean(confidences)) if confidences else 0.0
                    log_detection(session_id, count, avg_conf)
            else:
                cv2.putText(frame, "No model loaded", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

            recorder.write(frame)

            if not ws.connected:
                break

            _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            try:
                ws.send(json.dumps({
                    "frame": base64.b64encode(buf).decode(),
                    "count": count,
                    "session_active": True,
                    "session_id": session_id,
                }))
            except Exception:
                break

    except Exception as e:
        print(f"[WS] Stream ended: {e}")
    finally:
        cap.release()
        saved_path = recorder.stop()
        end_session(session_id, max_count, saved_path)  # Use max_count instead of count
        try:
            if ws.connected:
                ws.send(json.dumps({
                    "frame": "", "count": max_count,  # Send max_count in final message
                    "session_active": False,
                    "session_id": session_id,
                }))
        except Exception:
            pass


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)

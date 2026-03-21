import os
import numpy as np
from ultralytics import YOLO

model_path = os.getenv("MODEL_PATH", "box_detection.pt")
CONF_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", 0.5))

if os.path.exists(model_path):
    _model = YOLO(model_path)
    print(f"[detector] Loaded: {model_path}")
else:
    print(f"[detector] WARNING: {model_path} not found — using yolov8n.pt fallback")
    _model = YOLO("yolov8n.pt")

def detect_boxes(frame: np.ndarray, confidence_threshold: float) -> list:
    """Returns list of (x1, y1, x2, y2) boxes above confidence threshold."""
    results = _model(frame, verbose=False, conf=confidence_threshold)[0]
    boxes = []
    if results.boxes is not None:
        for box in results.boxes:
            conf = float(box.conf[0])
            if conf >= confidence_threshold:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                boxes.append((x1, y1, x2, y2))
    return boxes

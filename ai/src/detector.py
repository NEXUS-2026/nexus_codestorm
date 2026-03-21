import os
import cv2
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
    
    # Resize for better detection
    resized = cv2.resize(frame, (640, 640))
    h, w = frame.shape[:2]
    x_scale = w / 640
    y_scale = h / 640
    
    results = _model(
        resized,
        verbose=False,
        conf=confidence_threshold,
        iou=0.3,
        agnostic_nms=True
    )[0]
    
    boxes = []
    if results.boxes is not None:
        for box in results.boxes:
            conf = float(box.conf[0])
            if conf >= confidence_threshold:
                x1 = int(box.xyxy[0][0] * x_scale)
                y1 = int(box.xyxy[0][1] * y_scale)
                x2 = int(box.xyxy[0][2] * x_scale)
                y2 = int(box.xyxy[0][3] * y_scale)
                boxes.append((x1, y1, x2, y2))
    return boxes
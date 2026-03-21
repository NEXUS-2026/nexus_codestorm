import os
import cv2
import numpy as np
import torch
import warnings
warnings.filterwarnings("ignore")

model_path = os.getenv("MODEL_PATH", "box_detection.pt")
CONF_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", 0.35))

if os.path.exists(model_path):
    _model = torch.hub.load('ultralytics/yolov5', 'custom', 
                            path=model_path, force_reload=False)
    _model.eval()
    print(f"[detector] Loaded: {model_path}")
else:
    print(f"[detector] WARNING: {model_path} not found")
    _model = None

def detect_boxes(frame: np.ndarray, confidence_threshold: float) -> list:
    if _model is None:
        return []

    resized = cv2.resize(frame, (640, 640))
    h, w = frame.shape[:2]
    x_scale = w / 640
    y_scale = h / 640

    _model.conf = confidence_threshold
    _model.iou = 0.3
    _model.agnostic = True

    results = _model(resized)

    boxes = []
    for *xyxy, conf, cls in results.xyxy[0].tolist():
        if conf >= confidence_threshold:
            x1 = int(xyxy[0] * x_scale)
            y1 = int(xyxy[1] * y_scale)
            x2 = int(xyxy[2] * x_scale)
            y2 = int(xyxy[3] * y_scale)
            boxes.append((x1, y1, x2, y2))

    return boxes
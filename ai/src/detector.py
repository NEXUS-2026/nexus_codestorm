import os
import cv2
import torch

model_path = os.getenv("MODEL_PATH", "bov_detection.pt")

if os.path.exists(model_path):
    model = torch.hub.load('ultralytics/yolov5', 'custom', path=model_path, force_reload=False)
    model.eval()
else:
    model = None
    print(f"WARNING: Model not found at {model_path}")

def detect_boxes(frame, confidence_threshold):
    if model is None:
        return []
    
    resized = cv2.resize(frame, (640, 640))
    
    model.conf = confidence_threshold
    model.iou = 0.3  # ADD THIS — lower IOU means more overlapping boxes get kept
    model.agnostic = True  # ADD THIS — treats all detections as same class
    
    results = model(resized)
    # Scale boxes back to original frame size
    h, w = frame.shape[:2]
    x_scale = w / 640
    y_scale = h / 640
    boxes = []
    
    for *xyxy, conf, cls in results.xyxy[0].tolist():
        if conf >= confidence_threshold:
            x1, y1, x2, y2 = map(int, xyxy)
            boxes.append((x1, y1, x2, y2))
            
    return boxes
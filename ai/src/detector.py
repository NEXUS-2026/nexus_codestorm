import os
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
    
    model.conf = confidence_threshold
    
    results = model(frame)
    boxes = []
    
    for *xyxy, conf, cls in results.xyxy[0].tolist():
        if conf >= confidence_threshold:
            x1, y1, x2, y2 = map(int, xyxy)
            boxes.append((x1, y1, x2, y2))
            
    return boxes
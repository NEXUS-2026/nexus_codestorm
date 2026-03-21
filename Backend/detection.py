"""
BoxTrack — YOLO Box Counter
Wraps Ultralytics YOLOv8 for real-time box detection.

If Backend/models/best.pt exists → uses custom trained model (all detections = boxes)
Otherwise → falls back to yolov8n.pt and filters COCO classes that resemble boxes
"""

import os
import cv2
import numpy as np
from ultralytics import YOLO

CONF_THRESHOLD = 0.35

# COCO class names that resemble boxes/packages (fallback mode only)
_BOX_LIKE_CLASSES = {
    "suitcase", "backpack", "handbag", "book",
    "box", "package", "carton", "container"
}

# Overlay colours (BGR)
_BOX_COLOR  = (56, 189, 248)   # sky-400
_LABEL_BG   = (15, 23, 42)     # dark navy
_TEXT_COLOR = (255, 255, 255)  # white


class BoxCounter:
    def __init__(self, model_path: str):
        if os.path.exists(model_path):
            self.model = YOLO(model_path)
            self._custom = True
            print(f"[BoxCounter] Loaded custom model: {model_path}")
        else:
            print(f"[BoxCounter] WARNING: {model_path} not found — using yolov8n.pt fallback")
            self.model = YOLO("yolov8n.pt")
            self._custom = False

        self.model.fuse()

        self._boxes  = []
        self._confs  = []
        self._labels = []

        print(f"[BoxCounter] Classes: {self.model.names}")

    def process_frame(self, frame: np.ndarray) -> tuple:
        """Run inference. Returns (count, confidences)."""
        results = self.model(frame, verbose=False, conf=CONF_THRESHOLD)[0]

        boxes, confs, labels = [], [], []

        if results.boxes is not None:
            for box in results.boxes:
                conf = float(box.conf[0])
                if conf < CONF_THRESHOLD:
                    continue
                cls_id = int(box.cls[0])
                label  = self.model.names.get(cls_id, str(cls_id))

                # In fallback mode, only count box-like COCO classes
                if not self._custom and label.lower() not in _BOX_LIKE_CLASSES:
                    continue

                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                boxes.append((x1, y1, x2, y2))
                confs.append(conf)
                labels.append(label)

        self._boxes  = boxes
        self._confs  = confs
        self._labels = labels

        return len(boxes), confs

    def draw_overlay(self, frame: np.ndarray, count: int) -> np.ndarray:
        """
        Draw bounding boxes + confidence labels + count badge on the frame.
        Returns the annotated frame.
        """
        # Per-detection boxes
        for (x1, y1, x2, y2), conf, label in zip(self._boxes, self._confs, self._labels):
            # Colour by confidence: green -> yellow -> red
            if conf >= 0.75:
                color = (74, 222, 128)   # green
            elif conf >= 0.5:
                color = (250, 204, 21)   # yellow
            else:
                color = (248, 113, 113)  # red

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

            text = f"{label} {conf:.2f}"
            (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(frame, (x1, y1 - th - 6), (x1 + tw + 6, y1), _LABEL_BG, -1)
            cv2.putText(frame, text, (x1 + 3, y1 - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, _TEXT_COLOR, 1, cv2.LINE_AA)

        # Count badge top-left
        badge = f"Boxes: {count}"
        (bw, bh), _ = cv2.getTextSize(badge, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
        pad = 8
        cv2.rectangle(frame, (10, 10), (10 + bw + pad * 2, 10 + bh + pad * 2), _LABEL_BG, -1)
        cv2.rectangle(frame, (10, 10), (10 + bw + pad * 2, 10 + bh + pad * 2), _BOX_COLOR, 1)
        cv2.putText(frame, badge, (10 + pad, 10 + bh + pad),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, _BOX_COLOR, 2, cv2.LINE_AA)

        return frame

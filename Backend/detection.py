"""
BoxTrack — YOLO Box Counter
Supports both YOLOv5 (.pt trained with yolov5) and YOLOv8 (ultralytics) models.
Auto-detects model format on load.
"""

import os
import cv2
import numpy as np

CONF_THRESHOLD = 0.35

# Overlay colours (BGR)
_BOX_COLOR  = (56, 189, 248)   # sky-400
_LABEL_BG   = (15, 23, 42)     # dark navy
_TEXT_COLOR = (255, 255, 255)  # white


def _is_yolov5_checkpoint(model_path: str) -> bool:
    """Peek at the pickle to check if it's a YOLOv5 checkpoint."""
    try:
        import pickle, io
        # Read raw bytes and scan for the YOLOv5 module signature
        with open(model_path, "rb") as f:
            raw = f.read(4096)
        return b"models.yolo" in raw or b"models.common" in raw
    except Exception:
        return False


class BoxCounter:
    def __init__(self, model_path: str):
        self._yolo_version = None

        if not os.path.exists(model_path):
            print(f"[BoxCounter] WARNING: {model_path} not found — falling back to yolov8n.pt")
            model_path = os.path.join(os.path.dirname(model_path), "yolov8n.pt")

        if _is_yolov5_checkpoint(model_path):
            self._load_v5(model_path)
        else:
            self._load_v8(model_path)

        self._boxes  = []
        self._confs  = []
        self._labels = []

    def _load_v5(self, model_path: str):
        import torch
        import pathlib
        import platform

        print(f"[BoxCounter] Detected YOLOv5 format: {model_path}")

        # Models trained on Linux embed PosixPath objects which can't be
        # unpickled on Windows. Patch only on Windows, always restore after.
        # On Linux this block is a no-op so behaviour is identical.
        _orig = pathlib.PosixPath
        if platform.system() == "Windows":
            pathlib.PosixPath = pathlib.WindowsPath

        try:
            self.model = torch.hub.load(
                "ultralytics/yolov5", "custom",
                path=model_path, trust_repo=True, force_reload=False, verbose=False
            )
            self.model.conf = CONF_THRESHOLD
            self._yolo_version = 5
            self._custom = True
            print(f"[BoxCounter] YOLOv5 loaded. Classes: {self.model.names}")
        finally:
            pathlib.PosixPath = _orig  # always restore, on both platforms

    def _load_v8(self, model_path: str):
        from ultralytics import YOLO
        print(f"[BoxCounter] Detected YOLOv8 format: {model_path}")
        self.model = YOLO(model_path)
        try:
            self.model.fuse()
        except Exception as e:
            print(f"[BoxCounter] fuse() skipped: {e}")
        self._yolo_version = 8
        self._custom = not model_path.endswith("yolov8n.pt")
        print(f"[BoxCounter] YOLOv8 loaded (custom={self._custom}). Classes: {self.model.names}")

    def process_frame(self, frame: np.ndarray) -> tuple:
        """Run inference. Returns (count, confidences)."""
        if self._yolo_version == 5:
            return self._process_v5(frame)
        return self._process_v8(frame)

    def _process_v5(self, frame: np.ndarray) -> tuple:
        results = self.model(frame)
        # Use tensor output directly — avoids pandas dependency
        preds = results.xyxy[0]  # [x1, y1, x2, y2, conf, cls]

        boxes, confs, labels = [], [], []
        for *xyxy, conf, cls in preds.tolist():
            if conf < CONF_THRESHOLD:
                continue
            x1, y1, x2, y2 = map(int, xyxy)
            boxes.append((x1, y1, x2, y2))
            confs.append(float(conf))
            labels.append(self.model.names[int(cls)])

        self._boxes  = boxes
        self._confs  = confs
        self._labels = labels
        return len(boxes), confs

    def _process_v8(self, frame: np.ndarray) -> tuple:
        results = self.model(frame, verbose=False, conf=CONF_THRESHOLD)[0]
        boxes, confs, labels = [], [], []

        if results.boxes is not None:
            for box in results.boxes:
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                label  = self.model.names.get(cls_id, str(cls_id))
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                boxes.append((x1, y1, x2, y2))
                confs.append(conf)
                labels.append(label)

        self._boxes  = boxes
        self._confs  = confs
        self._labels = labels
        return len(boxes), confs

    def draw_overlay(self, frame: np.ndarray, count: int) -> np.ndarray:
        for (x1, y1, x2, y2), conf, label in zip(self._boxes, self._confs, self._labels):
            if conf >= 0.75:
                color = (74, 222, 128)
            elif conf >= 0.5:
                color = (250, 204, 21)
            else:
                color = (248, 113, 113)

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            text = f"{label} {conf:.2f}"
            (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(frame, (x1, y1 - th - 6), (x1 + tw + 6, y1), _LABEL_BG, -1)
            cv2.putText(frame, text, (x1 + 3, y1 - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, _TEXT_COLOR, 1, cv2.LINE_AA)

        badge = f"Boxes: {count}"
        (bw, bh), _ = cv2.getTextSize(badge, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
        pad = 8
        cv2.rectangle(frame, (10, 10), (10 + bw + pad*2, 10 + bh + pad*2), _LABEL_BG, -1)
        cv2.rectangle(frame, (10, 10), (10 + bw + pad*2, 10 + bh + pad*2), _BOX_COLOR, 1)
        cv2.putText(frame, badge, (10 + pad, 10 + bh + pad),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, _BOX_COLOR, 2, cv2.LINE_AA)
        return frame

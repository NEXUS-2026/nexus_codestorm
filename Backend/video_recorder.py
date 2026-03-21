import cv2
import os
from datetime import datetime

RECORDINGS_DIR = os.path.join(os.path.dirname(__file__), "..", "recordings")
os.makedirs(RECORDINGS_DIR, exist_ok=True)


class VideoRecorder:
    def __init__(self, session_id: str, fps: int = 10, resolution: tuple = (640, 480)):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"session_{session_id}_{timestamp}.mp4"
        self.output_path = os.path.abspath(os.path.join(RECORDINGS_DIR, filename))
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        self.writer = cv2.VideoWriter(self.output_path, fourcc, fps, resolution)
        self.active = True

    def write(self, frame):
        if self.active:
            self.writer.write(frame)

    def stop(self) -> str:
        if self.active:
            self.writer.release()
            self.active = False
        return self.output_path

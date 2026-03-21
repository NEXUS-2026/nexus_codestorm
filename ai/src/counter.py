import cv2
from scipy import stats

def is_inside_roi(centroid, roi_polygon):
    result = cv2.pointPolygonTest(roi_polygon, (float(centroid[0]), float(centroid[1])), False)
    return result >= 0

def get_stable_count(tracker):
    if len(tracker.count_history) > 0:
        mode_result = stats.mode(list(tracker.count_history), keepdims=True)
        return int(mode_result.mode[0])
    return 0

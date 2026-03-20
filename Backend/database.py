from pymongo import MongoClient, DESCENDING
from bson import ObjectId
from datetime import datetime, timezone
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "warehouse_counter"

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client[DB_NAME]

sessions_col = db["sessions"]
logs_col = db["detection_logs"]


# ── Sessions ──────────────────────────────────────────────────

def create_session(batch_id: str, operator_id: str, source_type: str = "live", upload_path: str = None) -> str:
    doc = {
        "batch_id": batch_id,
        "operator_id": operator_id,
        "started_at": datetime.now(timezone.utc),
        "ended_at": None,
        "final_count": None,
        "video_path": None,
        "source_type": source_type,   # "live" | "upload"
        "upload_path": upload_path,   # original uploaded file path (upload sessions only)
        "status": "active",
    }
    result = sessions_col.insert_one(doc)
    return str(result.inserted_id)


def end_session(session_id: str, final_count: int, video_path: str):
    sessions_col.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {
            "ended_at": datetime.now(timezone.utc),
            "final_count": final_count,
            "video_path": video_path,
            "status": "completed",
        }}
    )


def get_session(session_id: str) -> dict:
    doc = sessions_col.find_one({"_id": ObjectId(session_id)})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


def list_sessions(limit: int = 200) -> list:
    results = []
    for doc in sessions_col.find().sort("started_at", DESCENDING).limit(limit):
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results


# ── Detection Logs ────────────────────────────────────────────

def log_detection(session_id: str, box_count: int, confidence: float):
    logs_col.insert_one({
        "session_id": ObjectId(session_id),
        "timestamp": datetime.now(timezone.utc),
        "box_count": box_count,
        "confidence": confidence,
    })


def get_logs_for_session(session_id: str) -> list:
    results = []
    for doc in logs_col.find({"session_id": ObjectId(session_id)}).sort("timestamp", 1):
        doc["_id"] = str(doc["_id"])
        doc["session_id"] = str(doc["session_id"])
        results.append(doc)
    return results


def delete_session(session_id: str) -> bool:
    """Delete a session and all its detection logs. Returns True if session existed."""
    result = sessions_col.delete_one({"_id": ObjectId(session_id)})
    logs_col.delete_many({"session_id": ObjectId(session_id)})
    return result.deleted_count > 0


# ── Operator Stats ────────────────────────────────────────────

def get_operator_stats() -> list:
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": "$operator_id",
            "total_sessions": {"$sum": 1},
            "total_boxes": {"$sum": "$final_count"},
            "avg_count": {"$avg": "$final_count"},
        }},
        {"$sort": {"total_boxes": -1}},
    ]
    return list(sessions_col.aggregate(pipeline))

import os
import shutil

base = r"D:\VS-Code projects\nexus_codestorm\Backend"

dirs = ["app/core", "app/services", "tests", "scripts", "models", "routers"]
for d in dirs:
    os.makedirs(os.path.join(base, d), exist_ok=True)
    if d.startswith("app"):
        open(os.path.join(base, d, "__init__.py"), "w").close()

open(os.path.join(base, "app", "__init__.py"), "w").close()
open(os.path.join(base, "tests", "__init__.py"), "w").close()

moves = {
    "detection.py": "app/core/detection.py",
    "tracker.py": "app/core/tracker.py",
    "video_recorder.py": "app/core/video_recorder.py",
    
    "auth.py": "app/services/auth.py",
    "database.py": "app/services/database.py",
    "pdf_generator.py": "app/services/pdf_generator.py",
    
    "test_confidence.py": "tests/test_confidence.py",
    "test_imports.py": "tests/test_imports.py",
    "test_routes.py": "tests/test_routes.py",
    
    "check_sessions.py": "scripts/check_sessions.py",
    "main_minimal.py": "scripts/main_minimal.py",
    "start_server.py": "scripts/start_server.py",
    "install_auth.bat": "scripts/install_auth.bat",
    "test_server.html": "scripts/test_server.html",
    
    "yolov8n.pt": "models/yolov8n.pt",
}

for src, dst in moves.items():
    src_path = os.path.join(base, src)
    if os.path.exists(src_path):
        shutil.move(src_path, os.path.join(base, dst))
        print(f"Moved {src} to {dst}")

main_path = os.path.join(base, "main.py")
if os.path.exists(main_path):
    with open(main_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    content = content.replace("from database import", "from app.services.database import")
    content = content.replace("from auth import", "from app.services.auth import")
    content = content.replace("from video_recorder import", "from app.core.video_recorder import")
    content = content.replace("from pdf_generator import", "from app.services.pdf_generator import")
    content = content.replace("from detection import", "from app.core.detection import")
    
    with open(main_path, "w", encoding="utf-8") as f:
        f.write(content)

det_path = os.path.join(base, "app/core/detection.py")
if os.path.exists(det_path):
    with open(det_path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace("from tracker import", "from app.core.tracker import")
    with open(det_path, "w", encoding="utf-8") as f:
        f.write(content)

test_routes = os.path.join(base, "tests/test_routes.py")
if os.path.exists(test_routes):
    with open(test_routes, "r", encoding="utf-8") as f:
        c = f.read()
    c = c.replace("from main import", "import sys\nimport os\nsys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))\nfrom main import")
    with open(test_routes, "w", encoding="utf-8") as f:
        f.write(c)

test_conf = os.path.join(base, "tests/test_confidence.py")
if os.path.exists(test_conf):
    with open(test_conf, "r", encoding="utf-8") as f:
        c = f.read()
    c = c.replace("from detection import", "import sys\nimport os\nsys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))\nfrom app.core.detection import")
    with open(test_conf, "w", encoding="utf-8") as f:
        f.write(c)

print("Architecture refactored successfully.")

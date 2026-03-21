"""
Minimal server to test if Flask and CORS are working
"""
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

@app.route("/")
def index():
    return jsonify({"status": "ok", "message": "Minimal server is running"})

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/auth/signup", methods=["POST", "OPTIONS"])
def signup():
    if request.method == "OPTIONS":
        return "", 200
    
    data = request.get_json() or {}
    return jsonify({
        "success": True,
        "message": "Signup endpoint is working (auth not yet enabled)",
        "received": data
    }), 200

if __name__ == "__main__":
    print("=" * 60)
    print("MINIMAL TEST SERVER")
    print("=" * 60)
    print("Starting on http://localhost:5000")
    print("Press Ctrl+C to stop")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=True)

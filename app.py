#!/usr/bin/env python3
"""
NeighborLearn backend — pure Python standard library, no pip installs.

It does two jobs:
  1. Serves the static site from the public/ folder.
  2. Provides a tiny JSON API so the frontend can really persist data
     to a file on disk (data.json):
        GET  /api/db   -> returns the whole database as JSON
        POST /api/db   -> overwrites data.json with the posted JSON

Run it from the project root:
    python3 app.py
Then open http://localhost:8000 in your browser.
"""

import http.server
import socketserver
import json
import os

PORT = 8000
ROOT_DIR   = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(ROOT_DIR, "public")
DB_FILE    = os.path.join(ROOT_DIR, "data.json")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # static files are served from public/
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        # never cache, so the browser always gets the latest files
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _send_json(self, code, payload_bytes):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload_bytes)))
        self.end_headers()
        self.wfile.write(payload_bytes)

    def do_GET(self):
        if self.path == "/api/db":
            with open(DB_FILE, "rb") as f:
                self._send_json(200, f.read())
            return
        # everything else is a normal static file request
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/db":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                json.loads(body)  # validate before writing
            except Exception:
                self._send_json(400, b'{"error":"invalid json"}')
                return
            with open(DB_FILE, "wb") as f:
                f.write(body)
            self._send_json(200, b'{"ok":true}')
            return

        self._send_json(404, b'{"error":"not found"}')

    def log_message(self, fmt, *args):
        print("  " + (fmt % args))


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"NeighborLearn running at  http://localhost:{PORT}")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")

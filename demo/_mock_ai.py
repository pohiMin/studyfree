# -*- coding: utf-8 -*-
"""开发用 mock：模拟 OpenAI 兼容的 chat/completions，供 AI 复核端到端测试。
   GET /mode?m=yes|no|err  切换返回「对」「错」或 500
   GET /count              查看已收到多少次判分请求
   POST /v1/chat/completions"""
import json
from http.server import BaseHTTPRequestHandler, HTTPServer

STATE = {"mode": "yes", "n": 0}


class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/mode"):
            m = "yes"
            if "m=" in self.path:
                m = self.path.split("m=")[1][:5]
            STATE["mode"] = m
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"mode": m}).encode())
            return
        if self.path.startswith("/count"):
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"n": STATE["n"]}).encode())
            return
        if self.path.startswith("/reset"):
            STATE["n"] = 0
            self.send_response(200)
            self._cors()
            self.end_headers()
            return
        self.send_response(404)
        self._cors()
        self.end_headers()

    def do_POST(self):
        ln = int(self.headers.get("Content-Length") or 0)
        _ = self.rfile.read(ln)
        STATE["n"] += 1
        if STATE["mode"] == "err":
            self.send_response(500)
            self._cors()
            self.end_headers()
            return
        content = "对" if STATE["mode"] == "yes" else "错"
        body = json.dumps({
            "choices": [{"message": {"content": content}}]
        }).encode()
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    HTTPServer(("127.0.0.1", 8896), H).serve_forever()

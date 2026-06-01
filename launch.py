import http.server
import socketserver
import webbrowser
import threading
import time
import sys

PORT = 8080
DIRECTORY = r"C:\Users\pope1\.gemini\antigravity\scratch\speed-distance-time-tutor"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Server successfully started at http://localhost:{PORT}")
            httpd.serve_forever()
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Start server in a daemon thread so it exits when the main process exits
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Wait a moment for server to initialize
    time.sleep(1.0)
    
    # Open default web browser
    print(f"Opening browser to http://localhost:{PORT}...")
    webbrowser.open(f"http://localhost:{PORT}")
    
    # Keep main thread alive to serve requests
    print("Press Ctrl+C in terminal to stop serving.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping server.")

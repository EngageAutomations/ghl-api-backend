#!/usr/bin/env python3
import http.server
import socketserver
import os
from urllib.parse import urlparse

PORT = 5000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        print(f"Request: {self.command} {parsed_path.path}")
        
        # Serve index.html for root requests
        if parsed_path.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            # Read and serve the HTML file
            try:
                with open('index.html', 'r', encoding='utf-8') as f:
                    content = f.read()
                self.wfile.write(content.encode('utf-8'))
            except FileNotFoundError:
                self.wfile.write(b'<h1>GoHighLevel Marketplace</h1><p>Loading...</p>')
        
        # Handle API status endpoints
        elif parsed_path.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = '{"status": "healthy", "service": "GoHighLevel Marketplace", "port": 5000}'
            self.wfile.write(response.encode('utf-8'))
        
        elif parsed_path.path.startswith('/api/'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = '{"status": "ready", "endpoint": "' + parsed_path.path + '", "backend": "https://dir.engageautomations.com"}'
            self.wfile.write(response.encode('utf-8'))
        
        else:
            # Default file serving
            super().do_GET()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("0.0.0.0", PORT), MyHTTPRequestHandler) as httpd:
        print(f"GoHighLevel Marketplace running on port {PORT}")
        print(f"Access at: http://localhost:{PORT}")
        print(f"OAuth Backend: https://dir.engageautomations.com")
        print(f"Installation: install_1750131573635")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped")
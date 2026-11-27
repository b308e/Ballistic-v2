# serve.py — Lokaler Testserver fuer die PWA (Service Worker braucht http://localhost)
# Aufruf:  python serve.py     dann Browser:  http://localhost:8000
import http.server
import socketserver
import os

PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    # Korrekte MIME-Typen, sonst blockt der Browser Module/Manifest
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript',
        '.json': 'application/manifest+json',
        '.css': 'text/css',
        '.html': 'text/html',
        '.png': 'image/png',
    }

    def end_headers(self):
        # Kein Cache beim Entwickeln: Aenderungen sofort sichtbar
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Service-Worker-Allowed', '/')
        super().end_headers()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("PWA laeuft auf http://localhost:%d  (Strg+C zum Beenden)" % PORT)
    httpd.serve_forever()
# Anatomy of a Request & Response

Every HTTP message has the same predictable structure. Learn these parts once and you can read any request in any tool.

## The request

```http
POST /api/users HTTP/1.1        ← method + path + version
Host: example.com               ← headers (metadata)
Content-Type: application/json
Authorization: Bearer eyJ...

{ "name": "Ada", "role": "admin" }   ← body (the payload)
```

- **Method** — the verb (`GET`, `POST`, …): what you want to do.
- **Path** — which resource (`/api/users`).
- **Headers** — metadata: content type, auth, caching hints.
- **Body** — the data you're sending (only for POST/PUT/PATCH usually).

## The response

```http
HTTP/1.1 201 Created            ← status code + reason
Content-Type: application/json
Location: /api/users/99

{ "id": 99, "name": "Ada" }     ← body
```

- **Status code** — a 3-digit result (`201` = created).
- **Headers** — metadata about the response.
- **Body** — the returned data.

## Building the response on the server

Here's the same tiny "hello" server in four languages. Notice they all do the identical thing: listen, then send a status + headers + body.

```js
// JavaScript (Node.js)
import http from "node:http";

http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "hello" }));
  })
  .listen(3000);
```

```python
# Python (standard library)
from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"message": "hello"}).encode())

HTTPServer(("", 3000), Handler).serve_forever()
```

```go
// Go
package main

import (
	"encoding/json"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "hello"})
	})
	http.ListenAndServe(":3000", nil)
}
```

```java
// Java (built-in HttpServer)
import com.sun.net.httpserver.HttpServer;
import java.io.OutputStream;
import java.net.InetSocketAddress;

public class Main {
  public static void main(String[] args) throws Exception {
    HttpServer server = HttpServer.create(new InetSocketAddress(3000), 0);
    server.createContext("/", exchange -> {
      byte[] body = "{\"message\":\"hello\"}".getBytes();
      exchange.getResponseHeaders().set("Content-Type", "application/json");
      exchange.sendResponseHeaders(200, body.length);
      try (OutputStream os = exchange.getResponseBody()) { os.write(body); }
    });
    server.start();
  }
}
```

Different syntax, identical idea. That's the whole point of learning concepts first.

## Key takeaways

- Request = **method + path + headers + body**.
- Response = **status + headers + body**.
- Every language builds responses the same way underneath.
- Read messages by finding these parts and you'll never be lost.

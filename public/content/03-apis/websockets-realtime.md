# WebSockets & Real-time

Normal HTTP is **one-shot**: the client asks, the server answers, done. But some features need the *server* to push data the instant it changes — chat messages, live scores, notifications, collaborative editing. That's what real-time tech is for.

## The problem with plain HTTP

To get "live" data with HTTP alone, you'd have to **poll**: ask again and again "anything new? anything new?" This is wasteful (mostly empty responses) and laggy (updates wait for the next poll).

```
Polling:   client ─"new?"→ server ─"no"
           client ─"new?"→ server ─"no"     ← wasteful, always behind
           client ─"new?"→ server ─"yes!"
```

## WebSockets: a persistent two-way pipe

A **WebSocket** upgrades an HTTP connection into a **long-lived, bidirectional** channel. Once open, either side can send messages at any time — no repeated requests.

```
WebSocket:  client ⇄ server   (one open connection)
            server ──push──▶ client   (instantly, whenever)
            client ──send──▶ server
```

```js
// JavaScript — client
const ws = new WebSocket("wss://chat.example.com");
ws.onmessage = (e) => console.log("got:", e.data);
ws.send("hello server");
```

```js
// JavaScript — server (ws library)
import { WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8080 });
wss.on("connection", (socket) => {
  socket.on("message", (msg) => {
    // broadcast to everyone
    wss.clients.forEach((c) => c.send(msg.toString()));
  });
});
```

```python
# Python — server (websockets library)
import asyncio, websockets

clients = set()
async def handler(ws):
    clients.add(ws)
    async for msg in ws:
        for c in clients:
            await c.send(msg)

asyncio.run(websockets.serve(handler, "0.0.0.0", 8080))
```

```go
// Go — with gorilla/websocket
conn, _ := upgrader.Upgrade(w, r, nil) // HTTP → WebSocket
for {
	_, msg, err := conn.ReadMessage()
	if err != nil { break }
	conn.WriteMessage(websocket.TextMessage, msg) // echo/broadcast
}
```

## Other real-time options

- **Server-Sent Events (SSE)** — one-way server→client stream over plain HTTP. Simpler than WebSockets when you only need to *push* (e.g. a live feed).
- **Long polling** — a fallback: the request stays open until there's data. Works everywhere, less efficient.

## Scaling real-time (the hard part)

WebSockets are **stateful** — each connection lives on one server. With many servers, a message from a user on server A must reach a user on server B. The fix: a **message broker / pub-sub** (Redis, Kafka) that fans messages out across servers. (More in the Architecture stage.)

## Key takeaways

- HTTP is one-shot; **WebSockets** give a persistent, two-way channel for instant push.
- Prefer WebSockets over polling for chat, live updates, and collaboration.
- **SSE** is a simpler one-way alternative; long polling is a universal fallback.
- Scaling WebSockets needs a **pub/sub broker** to fan out across servers.

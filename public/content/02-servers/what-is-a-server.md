# What is a Server?

The word "server" is overloaded. It means two things, and it helps to keep them separate:

1. **The hardware** — a computer (often in a data center) that runs 24/7.
2. **The software** — a program that *listens* for requests and responds.

When backend devs say "the server," they usually mean the **software** — your app running on some machine, waiting for connections.

## What "listening" means

A server program binds to a **port** and waits. A port is a numbered channel (0–65535) so one machine can run many services at once:

- `80` — HTTP
- `443` — HTTPS
- `5432` — PostgreSQL
- `6379` — Redis

`your-server:443` is an **address + port**: which machine, which service.

> **Analogy:** An apartment building has one street address (IP), and each apartment has a number (port). The mail carrier (a request) needs both to deliver to the right door.

## The server loop

Under the hood, almost every server does this forever:

```
bind to a port
loop:
    accept an incoming connection
    read the request
    do the work (query DB, run logic)
    write the response
    close (or keep-alive)
```

Frameworks (Express, FastAPI, Spring) hide this loop so you just write the "do the work" part — the handlers.

## Minimal servers

```js
// JavaScript (Express)
import express from "express";
const app = express();
app.get("/", (_req, res) => res.send("up"));
app.listen(3000, () => console.log("listening on :3000"));
```

```python
# Python (Flask)
from flask import Flask
app = Flask(__name__)

@app.get("/")
def home(): return "up"

app.run(port=3000)
```

```go
// Go
http.HandleFunc("/", func(w http.ResponseWriter, _ *http.Request) {
	w.Write([]byte("up"))
})
http.ListenAndServe(":3000", nil)
```

```java
// Java (Spring Boot)
@RestController
class Ping {
  @GetMapping("/") String up() { return "up"; }
}
```

## Key takeaways

- "Server" = the always-on program that **listens and responds** (and the machine it runs on).
- It binds to a **port**; the IP + port identify a specific service.
- Every server runs an accept-read-work-respond loop; frameworks let you write only the "work" part.

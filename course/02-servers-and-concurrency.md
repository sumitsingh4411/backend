<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# 🖥️ Part 2 · Servers & concurrency

**How one machine serves thousands of people at once.**

<sub>`3 min read`</sub>

</div>

---

### In this part

- [2.1 What a "server" actually is](#21-what-a-server-actually-is)
- [2.2 The same endpoint in four languages](#22-the-same-endpoint-in-four-languages)
- [2.3 How one server handles thousands of users](#23-how-one-server-handles-thousands-of-users)
- [2.4 Stateless servers — the thing that lets you scale](#24-stateless-servers--the-thing-that-lets-you-scale)

---

## 2.1 What a "server" actually is

A program in an infinite loop, listening on a port, waiting for connections.

```js
// This is a web server. That's genuinely all one is.
import http from "node:http";

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ hello: "world" }));
}).listen(3000);
```

## 2.2 The same endpoint in four languages

Notice how little the *concepts* change. Frameworks are a detail.

<details open>
<summary><b>JavaScript</b> — Express</summary>

```js
import express from "express";
const app = express();

app.get("/users/:id", async (req, res) => {
  const user = await db.users.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "not_found" });
  res.json(user);
});

app.listen(3000);
```
</details>

<details>
<summary><b>Python</b> — FastAPI</summary>

```python
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    user = await db.users.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="not_found")
    return user
```
</details>

<details>
<summary><b>Go</b> — net/http</summary>

```go
func getUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    user, err := db.FindUserByID(id)
    if err != nil {
        http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
        return
    }
    json.NewEncoder(w).Encode(user)
}
```
</details>

<details>
<summary><b>Java</b> — Spring Boot</summary>

```java
@RestController
class UserController {
    @GetMapping("/users/{id}")
    ResponseEntity<User> getUser(@PathVariable Long id) {
        return userRepo.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
```
</details>

**Four languages. One idea:** match a route → load the thing → 404 if missing → serialise it.

## 2.3 How one server handles thousands of users

The key insight: **your server spends almost all its time waiting**, not computing. Waiting on the database. Waiting on an API. Waiting on disk.

| Approach | How it works | Used by |
|---|---|---|
| **Process per request** | Heavy. Real memory each. Doesn't scale far. | old CGI |
| **Thread per request** | Lighter. But 10k threads = 10k stacks + context switching. | Java (classic), Rails |
| **Event loop** | **One thread**, never blocks. Registers a callback, moves on. | Node.js, nginx |
| **Green threads** | Cheap "threads" the *runtime* schedules. Thousands are free. | Go, Java 21+ virtual threads |

> ### 🚨 The classic Node.js mistake
>
> The event loop is **one thread**. If you do something CPU-heavy on it — resize an image, hash a huge file, parse a 50MB JSON — **the entire server freezes for every user** until it finishes.
>
> - **I/O-bound** (waiting on DB/network) → async is perfect. This is 95% of web apps.
> - **CPU-bound** (actually computing) → async does nothing. Move it to a **worker thread** or a **job queue**.

## 2.4 Stateless servers — the thing that lets you scale

Ask yourself one question:

> **Can I kill any server at random and lose nothing?**

If yes, you can scale horizontally: just add more boxes behind a load balancer. If no, find what's stuck in that server's memory and move it out:

| Don't keep in the server | Put it here instead |
|---|---|
| Sessions in memory | Redis, or a signed token |
| Uploaded files on local disk | S3 / object storage |
| A cache in a local `Map` | Redis |
| A background `setInterval` | A job queue or a real scheduler |

---

<div align="center">

[← 🌐 Part 1 · HTTP](01-http.md) · [**Contents**](../README.md#contents) · [🔌 Part 3 · APIs →](03-apis.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>

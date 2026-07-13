# Processes, Threads & Concurrency

Your server must handle many users *at the same time*. How it does that — its **concurrency model** — shapes its performance and the bugs you'll hit. This is where backend gets interesting.

## The building blocks

- **Process** — an isolated running program with its own memory. Crashing one doesn't crash others.
- **Thread** — a lighter unit of execution *inside* a process, sharing its memory. Multiple threads = multiple things at once, but shared memory means you must be careful (race conditions).

## The core problem: I/O is slow

Most backend work is **waiting** — for a database, a network call, a disk. A CPU can do millions of operations in the time one database query takes. If your server just *sits* and waits, it wastes that time.

Two ways to stay busy while waiting:

### 1. Thread-per-request (blocking)
Give each request its own thread. When one blocks on I/O, the OS runs another thread. Simple to reason about, but threads use memory, and thousands of them get expensive.
> Used by: traditional Java (Spring MVC), Python (WSGI), Ruby, PHP.

### 2. Event loop (non-blocking / async)
One thread runs a loop. Start an I/O operation, register a callback, and *immediately* move on to other work. When the I/O finishes, the loop runs your callback. One thread juggles thousands of connections.
> Used by: Node.js, and `async` code in Python/Go/Java.

```
Thread-per-request:        Event loop:
─────────────────          ──────────
req A → [wait...] → done    req A ─┐
req B → [wait...] → done    req B ─┤  one loop
req C → [wait...] → done    req C ─┘  interleaves the waits
(a thread each)             (one thread, many in flight)
```

## Async in each language

```js
// JavaScript — async is the default; the event loop is built in
app.get("/user/:id", async (req, res) => {
  const user = await db.findUser(req.params.id); // non-blocking wait
  res.json(user);
});
```

```python
# Python — opt into async with asyncio / an async framework
@app.get("/user/{id}")
async def read(id: int):
    user = await db.find_user(id)
    return user
```

```go
// Go — goroutines: cheap concurrency, the runtime multiplexes them
go handleRequest(conn) // spawn thousands cheaply; blocking looks synchronous
```

```java
// Java — virtual threads (Project Loom) make blocking code scale
Thread.startVirtualThread(() -> handle(request));
```

## Why you care

- **Node** is single-threaded — never block it with heavy CPU work; offload that.
- **Race conditions** appear when threads share memory — guard shared state.
- Go's **goroutines** and Java's **virtual threads** give you async scale with simple-looking code.

## Key takeaways

- Backend work is mostly **waiting on I/O** — the goal is to stay busy meanwhile.
- **Thread-per-request** is simple but heavier; the **event loop** scales with one thread.
- Node = event loop (don't block it); Go = goroutines; modern Java = virtual threads.
- Shared memory between threads → beware **race conditions**.

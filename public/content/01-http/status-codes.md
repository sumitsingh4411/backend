# Status Codes

Every HTTP response starts with a 3-digit **status code** that summarizes what happened. The first digit tells you the category — memorize the categories and you're 80% there.

## The five families

| Range | Meaning | Vibe |
|---|---|---|
| **1xx** | Informational | "Hold on…" (rare) |
| **2xx** | Success | "Here you go" ✅ |
| **3xx** | Redirection | "Look over there" |
| **4xx** | Client error | "*You* messed up" |
| **5xx** | Server error | "*I* messed up" |

The 4xx vs 5xx distinction is huge: **4xx = the client's fault** (bad input, no auth), **5xx = the server's fault** (crash, bug). It tells you who to blame and where to look.

## The ones you'll use constantly

- **200 OK** — success (GET/PUT/PATCH).
- **201 Created** — success, a new resource was made (POST).
- **204 No Content** — success, nothing to return (DELETE).
- **301 / 302** — moved permanently / temporarily.
- **400 Bad Request** — malformed or invalid input.
- **401 Unauthorized** — you're not authenticated (log in).
- **403 Forbidden** — authenticated, but not allowed.
- **404 Not Found** — no such resource.
- **409 Conflict** — clashes with current state (e.g. duplicate email).
- **422 Unprocessable Entity** — validation failed.
- **429 Too Many Requests** — you're being rate-limited.
- **500 Internal Server Error** — unhandled server crash.
- **503 Service Unavailable** — overloaded or down for maintenance.

## 401 vs 403 (a common mix-up)

- **401** = "I don't know who you are." → authenticate.
- **403** = "I know who you are, and you can't do this." → permissions.

## Setting them in code

```js
// JavaScript (Express)
res.status(201).json(newUser);      // created
res.status(404).json({ error: "not found" });
```

```python
# Python (FastAPI)
raise HTTPException(status_code=404, detail="not found")
```

```go
// Go
w.WriteHeader(http.StatusNotFound) // 404
```

```java
// Java (Spring)
return ResponseEntity.status(HttpStatus.NOT_FOUND).body("not found");
```

## Key takeaways

- First digit = category: 2xx success, 3xx redirect, 4xx *client* error, 5xx *server* error.
- **4xx is the caller's fault; 5xx is yours.**
- Return honest, specific codes — clients and monitoring depend on them.
- Know 200/201/204, 400/401/403/404/409/429, and 500/503 cold.

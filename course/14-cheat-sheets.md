<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# 📋 Cheat sheets

**Status codes, latency numbers, and a red-flag checklist.**

<sub>`2 min read`</sub>

</div>

---

<details>
<summary><b>Status codes</b></summary>

```
2xx  200 OK · 201 Created · 202 Accepted · 204 No Content
4xx  400 Bad Request      · 401 Unauthenticated (not "unauthorized"!)
     403 Forbidden        · 404 Not Found
     409 Conflict         · 422 Unprocessable
     429 Too Many Requests (+ Retry-After)
5xx  500 Internal · 502 Bad Gateway · 503 Unavailable · 504 Gateway Timeout
```
</details>

<details>
<summary><b>Latency numbers</b></summary>

```
Memory read            0.1 ms
Redis / SSD            1   ms
Indexed DB query      10   ms
Same-region API       50   ms
Cross-continent      150   ms
Seconds in a day    86,400
1M req/day  ≈  12 req/s
```
</details>

<details>
<summary><b>🚩 Red flags — grep your codebase for these today</b></summary>

- An **ORM call inside a loop** (N+1)
- A **network call with no timeout**
- **Retries with no jitter**, or retrying a non-idempotent write
- `POST /payments` with **no idempotency key**
- **read-modify-write** with no lock, atomic update, or version check
- A resource id from the URL used with **no ownership check** (IDOR)
- Any query built by **string concatenation**
- Auth token in **`localStorage`** instead of an `HttpOnly` cookie
- `200 OK` with an **error body**
- A list endpoint with **no default limit**
- `pool size × instance count` **> what the DB accepts**
- A **cron inside an app that runs on many instances**
- **Secrets in git** (rotate them — deleting the commit does nothing)
- `CREATE INDEX` (not `CONCURRENTLY`) on a hot table
- Alerting on **causes** (CPU) instead of **symptoms** (error rate, p95)

</details>

---

<div align="center">

[← ❓ ❓ 130 system design interview questions](13-interview-questions.md) · [**Contents**](../README.md#contents) · [📚 📚 Where to go next →](15-resources.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>

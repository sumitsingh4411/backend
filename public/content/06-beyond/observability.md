# Observability

**Monitoring** tells you *that* something is wrong. **Observability** lets you figure out *why* — even for a failure you never anticipated. In production, you can't attach a debugger. This is how you see inside a running system.

## The three pillars

### 1. Logs — discrete events
"What happened?" Individual records of things that occurred. Great for detail, poor for trends.
> `{"event":"payment_failed","userId":7,"err":"card_declined"}`

### 2. Metrics — numbers over time
"How much / how many / how fast?" Cheap to store, perfect for dashboards and alerts. Aggregated, so you lose individual detail.
> `http_requests_total{status="500"} = 1423`, `request_duration_p95 = 240ms`

### 3. Traces — the path of one request
"Where did the time go?" A trace follows a single request across every service and database call, showing the timing of each hop.

```
Trace: POST /checkout            ── 812ms total
├── auth-service        12ms
├── inventory-service   40ms
├── payment-service    690ms  ← 🔴 here's your problem
│   └── stripe API     680ms
└── db: insert order    18ms
```

Traces are how you find the bottleneck in a distributed system in seconds instead of days.

## The metrics that actually matter

The **four golden signals** — if you track nothing else, track these:

1. **Latency** — how long requests take (track **p95/p99**, not the average — averages hide the pain of your slowest users).
2. **Traffic** — requests per second.
3. **Errors** — the rate of failed requests (5xx).
4. **Saturation** — how full your resources are (CPU, memory, connection pool).

## Instrumenting

```js
// JavaScript (prom-client) — a counter and a histogram
const requests = new Counter({ name: "http_requests_total", labelNames: ["method", "status"] });
const duration = new Histogram({ name: "http_request_duration_seconds" });

app.use((req, res, next) => {
  const end = duration.startTimer();
  res.on("finish", () => {
    requests.inc({ method: req.method, status: res.statusCode });
    end();
  });
  next();
});
```

```python
# Python (prometheus_client)
REQUESTS = Counter("http_requests_total", "Total requests", ["method", "status"])
LATENCY = Histogram("http_request_duration_seconds", "Request latency")

@LATENCY.time()
def handle(request):
    REQUESTS.labels(request.method, 200).inc()
```

## The toolchain

- **Metrics:** Prometheus + Grafana (the standard), Datadog, CloudWatch.
- **Logs:** Loki, ELK/OpenSearch, Datadog.
- **Traces:** Jaeger, Tempo, Honeycomb.
- **Standard:** **OpenTelemetry** — one vendor-neutral SDK that emits all three. Instrument once, switch backends freely. **Start here.**

## Health checks

Give your app endpoints your infrastructure can poll:

- **`/healthz` (liveness)** — "am I alive?" If not, restart me.
- **`/readyz` (readiness)** — "can I serve traffic?" (DB reachable, migrations done). If not, take me out of the load balancer but *don't* kill me.

## Alert on symptoms, not causes

Don't alert on "CPU is 90%" — that might be fine. Alert on what **users feel**:

> "Error rate > 1% for 5 minutes" · "p95 latency > 1s" · "checkout success rate dropped"

And make every alert **actionable**. An alert nobody acts on trains everyone to ignore alerts — that's how real outages get missed.

## Key takeaways

- **Logs** (events) + **metrics** (numbers) + **traces** (request paths) = observability.
- Track the **four golden signals**: latency (p95/p99), traffic, errors, saturation.
- Use **OpenTelemetry** to instrument once and stay vendor-neutral.
- Expose **liveness/readiness** endpoints; **alert on user-facing symptoms**, and make alerts actionable.

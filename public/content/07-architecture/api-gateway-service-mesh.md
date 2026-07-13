# API Gateways & Service Mesh

Once you have more than a couple of services, two questions appear:

1. How does the **outside world** get in? → **API Gateway** (north-south traffic)
2. How do services talk to **each other**? → **Service Mesh** (east-west traffic)

They solve different problems and people constantly confuse them.

---

# Part 1: The API Gateway

## The problem

You've split into services. Now every one of them must implement… the same things:

```
client ──▶ user-service      (auth? rate limit? TLS? logging? CORS?)
client ──▶ order-service     (auth? rate limit? TLS? logging? CORS?)
client ──▶ payment-service   (auth? rate limit? TLS? logging? CORS?)
```

Every service reimplements authentication, rate limiting, TLS, CORS, and logging. Five copies of the same code, five chances to get it subtly wrong. And the client has to know five hostnames.

## The solution: one front door

```
                    ┌─────────────────┐
                    │   API GATEWAY   │
 client ──────────▶ │  · TLS          │────▶ user-service
                    │  · auth         │────▶ order-service
                    │  · rate limit   │────▶ payment-service
                    │  · routing      │
                    │  · logging      │
                    └─────────────────┘
```

The gateway handles **cross-cutting concerns once**, at the edge, then forwards a clean request to the right service.

## What it does

- **Routing** — `/api/orders/*` → order-service. One public hostname; the internal topology stays hidden.
- **Authentication** — validate the JWT **once**. Services can then trust a simple `X-User-Id` header from the gateway (because nothing else can reach them).
- **Rate limiting** — abuse is rejected at the door, before it costs you anything.
- **TLS termination** — one place to manage certificates.
- **Request/response transformation** — aggregate several service calls into one response; hide internal field names.
- **Observability** — every request logged and traced from a single choke point.
- **Circuit breaking** — stop hammering a service that's already down.

## Backend for Frontend (BFF)

One gateway for everyone is a compromise: your mobile app wants small payloads; your web app wants rich ones; your partner API needs a totally different shape.

**BFF** gives each client type its own gateway, tailored to it:

```
mobile app  ──▶ [ Mobile BFF ]  ──┐
web app     ──▶ [ Web BFF ]     ──┼──▶ the same backend services
partners    ──▶ [ Public API ]  ──┘
```

Each BFF is owned by the team that owns that client, and can aggregate/trim exactly as that client needs — without a shared gateway becoming a battleground.

## The warnings

- ⚠️ **It's a single point of failure.** Run it redundantly.
- ⚠️ **Don't put business logic in it.** A gateway that starts making business decisions becomes a new, distributed monolith — the very thing you split up to avoid. Keep it to *cross-cutting concerns*.
- ⚠️ It's another hop of latency (usually a worthwhile trade).

**Tools:** Kong, Envoy, AWS API Gateway, Traefik, NGINX, Apigee.

---

# Part 2: The Service Mesh

## The problem it solves

The gateway handled traffic coming **in**. But your services also call **each other** — and that traffic needs the same reliability guarantees:

- Retries with backoff
- Timeouts
- Circuit breaking
- mTLS (so services can prove who they are to each other)
- Tracing
- Load balancing between instances

You *could* put all that in a shared library and import it into every service… but now every service must upgrade the library in lockstep, and it only works if all your services use the same language.

## The solution: sidecars

A **service mesh** moves that logic **out of your app** and into a **proxy (sidecar)** deployed next to every service. All network traffic silently flows through the sidecar.

```
┌── Pod ─────────────┐        ┌── Pod ─────────────┐
│  your app          │        │  your app          │
│      ↕             │        │      ↕             │
│  [ sidecar proxy ] │◀─mTLS─▶│  [ sidecar proxy ] │
└────────────────────┘        └────────────────────┘
         ▲                              ▲
         └──── control plane (policy, certs, telemetry) ────┘
```

Your application code makes a **plain HTTP call** to `http://order-service`. It has **no idea** that the sidecar is:
- encrypting the connection with mTLS
- retrying on failure
- enforcing a timeout
- tripping a circuit breaker
- load balancing across 12 instances
- emitting trace spans and metrics

## What you get

- 🔒 **Automatic mTLS everywhere** — zero-trust networking with no application changes. This alone justifies a mesh for many companies.
- 🔁 **Retries, timeouts, circuit breakers** — configured declaratively, not coded per service.
- 📊 **Uniform observability** — golden metrics and traces for *every* service, free, in any language.
- 🚦 **Traffic shifting** — send 5% of traffic to v2 (canary), mirror traffic, inject faults for chaos testing.
- 🌐 **Polyglot** — works identically for your Go, Python, and Java services.

```yaml
# Istio: a canary + retry policy — no application code changed
apiVersion: networking.istio.io/v1
kind: VirtualService
spec:
  http:
    - route:
        - destination: { host: orders, subset: v1 }
          weight: 95
        - destination: { host: orders, subset: v2 }   # 5% canary
          weight: 5
      retries:
        attempts: 3
        perTryTimeout: 2s
```

## The honest warning

**A service mesh is heavy.** You're adding a proxy to every pod (latency + memory), plus a control plane, plus a substantial new operational surface to learn and debug. When something breaks, you now have to work out whether it's your app *or* the mesh.

> **You almost certainly don't need a service mesh.** With fewer than ~10 services, a library (or just sensible timeouts and retries in your HTTP client) is far simpler and does 90% of the job.

Adopt one when you have **many services, multiple languages, and a hard requirement** for uniform mTLS/observability — and ideally a platform team to run it.

**Tools:** Istio, Linkerd (much simpler — start here), Consul Connect, Cilium.

---

## Gateway vs Mesh — the summary

| | **API Gateway** | **Service Mesh** |
|---|---|---|
| Traffic | **North-south** (in from outside) | **East-west** (service ↔ service) |
| Position | One, at the edge | A sidecar next to **every** service |
| Concerns | Auth, rate limit, routing, TLS | mTLS, retries, circuit breaking, tracing |
| Client | External (browsers, apps) | Internal services |
| Needed when | You have >1 service + public clients | You have *many* internal services |

They're **complementary**, not alternatives. A mature setup runs a gateway at the edge *and* a mesh inside.

## Key takeaways

- An **API gateway** is the **single front door**: it does auth, rate limiting, routing, and TLS **once** so every service doesn't reimplement them. Keep **business logic out of it**.
- **BFF** gives each client type (mobile/web/partner) its own tailored gateway.
- A **service mesh** moves service-to-service concerns (**mTLS, retries, timeouts, circuit breaking, tracing**) into **sidecar proxies** — invisible to your app code, and language-agnostic.
- Gateway = **north-south**; mesh = **east-west**. They complement each other.
- ⚠️ A mesh is genuinely heavy. Under ~10 services, use a library and sensible HTTP client defaults instead.

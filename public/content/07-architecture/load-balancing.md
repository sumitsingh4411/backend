# Load Balancing

Once you have more than one server, something must decide **which server gets each request**. That's the **load balancer** (LB) — the traffic cop sitting in front of your fleet.

```
                  ┌──▶ server 1  (healthy)
client ──▶  LB  ──┼──▶ server 2  (healthy)
                  └──▶ server 3  ❌ (unhealthy — skipped)
```

## What it does

1. **Distributes traffic** across healthy servers.
2. **Health checks** — polls each server (`/healthz`); a failing one is pulled out of rotation automatically.
3. **Terminates TLS** — handles HTTPS once at the edge so your app servers speak plain HTTP internally.
4. **Enables zero-downtime deploys** — drain one server, update it, add it back, repeat.

That health-check behavior is the real prize: a server can crash at 3am and **users never notice**.

## Algorithms

- **Round robin** — each server in turn. Simple, the common default.
- **Least connections** — send to whoever's least busy. Better when requests vary in cost.
- **IP hash / consistent hashing** — the same client always lands on the same server (used for sticky sessions or cache locality).
- **Weighted** — send more traffic to beefier machines.

## Layer 4 vs Layer 7

- **L4 (transport)** — routes by IP/port only. Doesn't read the request. Extremely fast.
- **L7 (application)** — reads the HTTP request, so it can route by **path or host**:

```
/api/*    → the API servers
/images/* → the image service
app.example.com  → frontend
api.example.com  → backend
```

L7 is what you usually want — it also enables TLS termination, header injection, and caching.

## Sticky sessions: a smell

Some LBs can pin a user to one server ("sticky sessions") so in-memory sessions work. It's a **crutch**: it defeats even load distribution, and when that server dies the user is logged out anyway.

> **Better:** make servers stateless (sessions in Redis or JWT). Then any server can serve anyone, and the LB is free to balance properly.

## The tools

- **Nginx / HAProxy / Envoy / Traefik** — self-managed reverse proxies.
- **AWS ALB/NLB, GCP Load Balancing, Cloudflare** — managed.
- **Kubernetes Service / Ingress** — LB built into the orchestrator.

```nginx
# Nginx as a simple L7 load balancer
upstream app_servers {
    least_conn;                  # algorithm
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;
}

server {
    listen 443 ssl;              # TLS terminated here
    location / {
        proxy_pass http://app_servers;
        proxy_set_header X-Real-IP $remote_addr;   # preserve the client IP!
    }
}
```

⚠️ Behind an LB, `req.ip` is the **load balancer's** IP. Read the real client IP from `X-Forwarded-For` (and configure your framework to trust the proxy) — otherwise rate limiting and logging will be useless.

## Don't forget: the LB is now a single point of failure

Ironically, the thing that gives you redundancy can itself go down. Managed LBs are redundant by default; if you self-host, run at least two with a failover IP.

## Key takeaways

- A load balancer **distributes traffic** across healthy servers and **health-checks** them out of rotation.
- It terminates **TLS** and enables **zero-downtime deploys**.
- **L7** routes by path/host; **L4** is faster but blind. Round robin and least-connections are the common algorithms.
- Avoid **sticky sessions** — make servers stateless instead. Read the client IP from `X-Forwarded-For`.

# Cloud Basics & Reverse Proxies

Where your code actually runs, and the layer that sits in front of it.

---

# Part 1: Cloud Basics

The cloud is just **someone else's computers, rented by the hour** — with the huge advantage that you can create and destroy them with an API call.

## The service models

- **IaaS** (Infrastructure as a Service) — raw VMs. *You* manage the OS, runtime, everything. Max control. *(EC2, Compute Engine)*
- **PaaS** (Platform as a Service) — push code, the platform runs it. *(Heroku, Render, Fly.io, App Engine)*
- **FaaS / Serverless** — deploy functions, scale to zero. *(Lambda, Cloud Functions)*
- **SaaS** — finished software you just use. *(Gmail)*

> Control ⬆️ as you go up the list. Convenience ⬆️ as you go down. **Start with a PaaS** — you'll ship in an afternoon. Move to IaaS/Kubernetes when you have a real reason.

## The building blocks you'll actually use

| Need | Service |
|---|---|
| **Compute** | VMs, containers, or functions |
| **Storage (objects)** | S3 / Cloud Storage — files, uploads, backups |
| **Database** | Managed Postgres (RDS, Cloud SQL) — *let them handle backups & failover* |
| **Cache** | Managed Redis (ElastiCache, Memorystore) |
| **Queue** | SQS, Pub/Sub |
| **CDN** | CloudFront, Cloudflare — cache static assets at the edge |
| **Secrets** | Secrets Manager, Vault |
| **DNS** | Route 53, Cloudflare |

**Use managed services.** Running your own Postgres with replication, backups, and failover is a full-time job. Paying for a managed one is almost always cheaper than your time.

## Regions and availability zones

- **Region** — a geographic location (`us-east-1`). Deploy near your users to cut latency.
- **Availability Zone (AZ)** — an isolated data center *within* a region.

Spread across **multiple AZs** and one data center failing doesn't take you down. This is the cheapest resilience you'll ever buy — usually just a checkbox.

## Cost traps that bite beginners

- **Egress (data transfer out) is expensive** — often the surprise on the bill.
- **Idle resources still cost money** — that forgotten test VM runs all month.
- **Serverless can be pricey at steady high volume** — it wins on spiky/low traffic.
- **Set billing alerts on day one.**

---

# Part 2: Reverse Proxies

A **reverse proxy** sits **in front of your app servers**. Clients talk to it; it talks to your app.

```
client ──▶ [ reverse proxy ] ──▶ app server 1
             (Nginx/Envoy)   └──▶ app server 2
```

> **Forward proxy** sits in front of *clients* (hides who's asking). A **reverse proxy** sits in front of *servers* (hides what's answering). Same tech, opposite direction.

## What it does for you

1. **TLS termination** — handles HTTPS once at the edge; your app speaks simple HTTP internally.
2. **Load balancing** — spreads traffic across instances.
3. **Routing** — by path or host (`/api/*` → API, `/` → frontend).
4. **Serving static files** — far faster than your app process.
5. **Caching** — serve repeat responses without touching your app.
6. **Compression** (gzip/brotli), rate limiting, and hiding your internal topology.

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location /api/ {
        proxy_pass http://localhost:3000;          # → your app
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;   # preserve the real client IP
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /var/www/frontend;                    # static files, served fast
        try_files $uri /index.html;                # SPA fallback
    }
}
```

⚠️ **Remember:** behind a proxy, your app sees the *proxy's* IP. Trust the proxy and read `X-Forwarded-For`, or your logging and rate limiting will treat every user as the same client.

## The tools

**Nginx** (the classic), **Caddy** (automatic HTTPS, dead simple), **Traefik** (container-native), **Envoy** (service mesh), **Cloudflare** (a managed proxy/CDN in front of everything).

## Key takeaways

- Cloud = rentable infra: **IaaS → PaaS → FaaS**, trading control for convenience. **Start with a PaaS**, use **managed** databases.
- Deploy across **multiple AZs** for cheap resilience; watch **egress costs** and set billing alerts.
- A **reverse proxy** fronts your servers: **TLS termination, load balancing, routing, static files, caching**.
- Always forward the real client IP via **`X-Forwarded-For`**.

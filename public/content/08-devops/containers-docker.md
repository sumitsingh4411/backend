# Containers & Docker

*"But it works on my machine!"* — Containers are the answer to that sentence.

## The problem

Your app needs Node 22, a specific OpenSSL, certain env vars, some system libraries. Your laptop has them. The production server has Node 18 and a different libc. It breaks. Multiply by every developer and every environment, forever.

## The fix: ship the environment with the app

A **container** packages your app **together with everything it needs to run** — runtime, libraries, dependencies, config — into one image that runs **identically everywhere**.

> **Analogy:** A shipping container. It doesn't matter what's inside or whether it's on a truck, ship, or train — the *outside* is standard, so any crane can move it. Containers standardize the interface between your app and the machine.

## Containers vs virtual machines

```
VMs:                              Containers:
┌─────┐┌─────┐┌─────┐             ┌─────┐┌─────┐┌─────┐
│ app ││ app ││ app │             │ app ││ app ││ app │
│ OS  ││ OS  ││ OS  │  ← heavy!   └─────┴┴─────┴┴─────┘
└─────┴┴─────┴┴─────┘             ┌─────────────────────┐
┌─────────────────────┐           │  container runtime  │
│     hypervisor      │           ├─────────────────────┤
│     host OS         │           │   shared host OS    │
└─────────────────────┘           └─────────────────────┘
  GBs, boots in minutes             MBs, boots in ms
```

VMs virtualize the **hardware** (each carries a full OS). Containers virtualize the **OS** — they share the host kernel and just isolate processes. That's why they're tiny and start instantly.

## The Dockerfile

A recipe for building your image:

```dockerfile
# Multi-stage build: compile in one stage, ship a lean runtime
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                      # cached unless deps change
COPY . .
RUN npm run build

FROM node:22-alpine             # final image: no build tools, much smaller
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node                       # ✅ don't run as root
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## Image vs container

- **Image** = the blueprint (immutable, versioned, shareable). Like a class.
- **Container** = a running instance of an image. Like an object.

One image → many identical containers. That's how you scale horizontally.

```bash
docker build -t myapp:1.0 .        # build the image
docker run -p 3000:3000 myapp:1.0  # run a container
docker push registry/myapp:1.0     # share it
```

## Layers and caching (why your builds are slow)

Each Dockerfile instruction creates a **layer**, and Docker caches them. If a layer changes, **every layer after it rebuilds**.

That's why you `COPY package.json` and `npm ci` *before* copying your source: your dependencies rarely change, so that expensive layer stays cached even when you edit code. Copy source first and you reinstall every dependency on every build.

## Docker Compose: your whole stack locally

```yaml
services:
  api:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/app  # "db" = the service name
    depends_on: [db]

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: pass
    volumes: ["pgdata:/var/lib/postgresql/data"]      # persist data

volumes:
  pgdata:
```

`docker compose up` → your API **and** database running, wired together, in one command. New teammates onboard in minutes.

## Rules for good images

- **Never bake secrets into an image** — anyone who pulls it can read them. Inject at runtime.
- **Use `.dockerignore`** (exclude `node_modules`, `.git`, `.env`).
- **Run as a non-root user**.
- **Pin versions** (`node:22-alpine`, not `node:latest`) — reproducibility is the point.
- **Containers are ephemeral** — never store data inside one. Use volumes or external storage.

## Key takeaways

- A **container** bundles your app + its dependencies → **runs identically everywhere**.
- Containers share the host kernel (MBs, instant) vs VMs which carry a full OS (GBs, slow).
- A **Dockerfile** builds an **image** (blueprint); a **container** is a running instance.
- Order Dockerfile steps for **layer caching**; use **Compose** for local stacks.
- No secrets in images, don't run as root, pin versions, keep containers stateless.

# Kubernetes Basics

You have 40 containers across 10 machines. One crashes at 3am. Traffic spikes and you need 20 more. A deploy goes out and must roll back cleanly.

Doing that by hand is impossible. **Kubernetes (K8s)** is the robot that does it for you — a **container orchestrator**.

## The core idea: declare the desired state

You don't tell Kubernetes *how* to do things step by step. You **declare what you want** and it continuously works to make reality match.

> "I want 3 replicas of this image running." → K8s ensures 3 are running. One dies? It starts another. A node dies? It reschedules elsewhere. **Forever, without you.**

That control loop — *observe reality → compare to desired → fix the difference* — is the whole philosophy.

## The objects you must know

- **Pod** — the smallest unit: one (or a few tightly-coupled) containers. **Pods are disposable** — they get killed and replaced constantly. Never treat one as precious.
- **Deployment** — manages a set of identical Pods. Handles **scaling** and **rolling updates/rollbacks**. This is what you mostly write.
- **Service** — a **stable** network address + load balancing for a changing set of Pods. Pods come and go with new IPs; the Service's address never changes.
- **Ingress** — routes external HTTP traffic into Services (host/path routing + TLS).
- **ConfigMap / Secret** — inject configuration and secrets as env vars or files.
- **Namespace** — a logical partition of the cluster (`dev`, `prod`).

```
        Ingress  (example.com/api → api-service)
           │
        Service  (stable IP, load balances across pods)
           │
   ┌───────┼───────┐
  Pod     Pod     Pod    ← managed by a Deployment (replicas: 3)
```

## A Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3                    # desired state: 3 pods
  selector:
    matchLabels: { app: api }
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
        - name: api
          image: registry/myapp:1.4.0     # pin the version
          ports: [{ containerPort: 3000 }]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef: { name: db-secret, key: url }   # secret, not hardcoded
          resources:                       # ⚠️ always set these
            requests: { cpu: 100m, memory: 128Mi }   # what it needs to be scheduled
            limits:   { cpu: 500m, memory: 512Mi }   # the ceiling it can't exceed
          livenessProbe:                   # dead? → restart it
            httpGet: { path: /healthz, port: 3000 }
          readinessProbe:                  # ready? → send it traffic
            httpGet: { path: /readyz, port: 3000 }
```

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector: { app: api }         # targets pods with this label
  ports: [{ port: 80, targetPort: 3000 }]
```

```bash
kubectl apply -f deployment.yaml   # declare it
kubectl get pods                   # see reality
kubectl logs -f deploy/api         # debug
kubectl rollout undo deploy/api    # instant rollback 🎉
```

## What you get for free

- **Self-healing** — crashed containers restart; failed nodes get their pods rescheduled.
- **Rolling updates & instant rollback** — built in.
- **Autoscaling** — the HPA adds pods when CPU/traffic rises.
- **Service discovery** — reach other services by name (`http://api-service`).

## The two probes (get these right)

- **livenessProbe** — "are you alive?" Fails → **restart** the pod.
- **readinessProbe** — "can you take traffic?" Fails → **remove from the Service** (but don't kill it).

Confusing them causes classic outages: a slow-starting app with an aggressive liveness probe gets **restart-looped forever**.

## The honest caveat

**Kubernetes is complex, and most projects don't need it.** It's a distributed operating system with a real learning curve and real ops cost.

> If you have a handful of services, a **PaaS** (Render, Fly.io, App Runner) gives you 90% of the benefit for 10% of the complexity.

Reach for K8s when you have **many services, multiple teams, and genuine scale** — or when your company already runs it.

## Key takeaways

- K8s **orchestrates containers**: you declare desired state, it continuously makes reality match.
- **Pod** (disposable unit) → **Deployment** (replicas + rolling updates) → **Service** (stable address) → **Ingress** (external routing).
- You get self-healing, rolling updates, rollback, and autoscaling for free.
- Always set **resource requests/limits** and correct **liveness vs readiness** probes.
- It's powerful but heavy — **use a PaaS until you truly need it.**

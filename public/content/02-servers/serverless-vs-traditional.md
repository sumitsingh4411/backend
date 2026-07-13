# Serverless vs Traditional Servers

You have two broad ways to run backend code. Neither is "better" — they trade off differently.

## Traditional (long-running server)

You run a process that stays up 24/7 on a machine (a VM, a container, a droplet). It's always listening.

- ✅ Full control, persistent memory, cheap under steady load, no cold starts.
- ✅ Great for WebSockets, background workers, predictable traffic.
- ❌ *You* manage scaling, patching, uptime. You pay even when idle.

## Serverless (functions on demand)

You upload individual functions (AWS Lambda, Cloud Functions, Vercel). The platform runs them **only when called** and scales automatically from zero to thousands.

- ✅ No servers to manage, scales to zero (pay per request), auto-scales up.
- ✅ Great for spiky, unpredictable, or event-driven workloads.
- ❌ **Cold starts**, execution time limits, no persistent memory, harder for long-lived connections.

## Cold starts explained

A serverless function that's been idle has no running instance. The next request must **boot a fresh environment** first — that startup delay is the *cold start* (tens to hundreds of ms). Once warm, subsequent calls are fast until it goes idle again.

```
Traditional:   [always running] → request → instant
Serverless:    (idle) → request → boot env (cold start) → run → (idle again)
```

## "Serverless" still has servers

The name is marketing — there are absolutely servers. You just don't *manage* them. Someone else handles the machines; you handle the code.

## How to choose

| Use serverless when… | Use traditional when… |
|---|---|
| Traffic is spiky or unknown | Traffic is steady/high |
| Tasks are short and stateless | You need WebSockets / long jobs |
| You want minimal ops | You want full control & tuning |
| Cost-at-zero matters | Cost-at-scale matters |

Many real systems mix both: a traditional API for the core app, serverless functions for occasional jobs (image resizing, webhooks).

## Key takeaways

- **Traditional** = always-on process you manage; predictable, great for persistent connections.
- **Serverless** = functions that run on demand and scale to zero; great for spiky/event-driven work.
- Serverless trades ops simplicity for **cold starts** and execution limits.
- "Serverless" ≠ no servers — just no servers *you* manage.

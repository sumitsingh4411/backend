# HTTP/1.1 vs HTTP/2 vs HTTP/3

HTTP has been rewritten twice for speed. The *semantics* (methods, status codes, headers) barely changed — what changed is **how bytes move on the wire**. Knowing the difference explains a lot of performance advice you've probably followed without knowing why.

## HTTP/1.1 (1997) — one request at a time

A connection handles **one request/response at a time**. Request A must finish before request B starts.

```
Connection 1:  [── request A ──][── request B ──][── request C ──]
                                 ↑ B waits for A, even if A is huge
```

This is **head-of-line blocking**: one slow response stalls everything queued behind it.

**The workaround:** browsers open **~6 parallel connections per domain**. That's a hack, and it's expensive (each needs its own TCP + TLS handshake).

**The era of hacks it created** — you may recognize these:
- **Bundling** all your JS into one file (fewer requests)
- **Sprite sheets** (one image instead of 30)
- **Domain sharding** (`img1.site.com`, `img2.site.com` to get more than 6 connections)

Every one of those exists to work around HTTP/1.1's limits.

## HTTP/2 (2015) — multiplexing

HTTP/2 sends **many streams over a single connection**, interleaved. Request B no longer waits for A.

```
Connection 1:  [A][B][C][A][C][B][A]   ← interleaved frames, one connection
```

What it brought:

- **Multiplexing** — many concurrent requests on one connection. *Kills HTTP-layer head-of-line blocking.*
- **Binary framing** — messages become binary frames instead of text. Faster and less error-prone to parse.
- **Header compression (HPACK)** — HTTP/1.1 resent the same fat headers (cookies!) on every request. HPACK sends them once.
- **Server push** — the server could pre-emptively send resources. *(Turned out to be a bad idea in practice and is now deprecated — browsers removed it.)*

> **Practical consequence:** with HTTP/2, aggressive bundling and domain sharding become **counterproductive**. Many small cacheable files are now fine — sometimes better.

## The remaining problem: TCP head-of-line blocking

HTTP/2 fixed blocking at the *HTTP* layer — but it still rides on **TCP**, and TCP guarantees in-order delivery of *its* bytes.

So if **one packet is lost**, TCP halts delivery of **everything** until it's retransmitted — even for streams that arrived perfectly. HTTP/2 was multiplexed on top of a protocol that fundamentally isn't.

```
TCP:  [pkt1][pkt2][💥 LOST][pkt4][pkt5]
                    ↑ pkt4 and pkt5 arrived fine, but TCP won't deliver them
                      until pkt2's replacement arrives. ALL streams stall.
```

On a flaky mobile network, this hurts badly.

## HTTP/3 (2022) — QUIC over UDP

HTTP/3 solves it by **abandoning TCP**. It runs on **QUIC**, a new transport built on **UDP**.

Because QUIC understands streams natively, a lost packet only blocks **the stream it belongs to** — the others keep flowing.

```
QUIC:  stream A: [──✅────]
       stream B: [──💥 lost — only B stalls]
       stream C: [──✅────]     ← A and C are unaffected
```

Other QUIC wins:

- **Faster handshakes** — TLS is built in, so connection setup takes **1 round trip** (or **0-RTT** on reconnect) instead of TCP+TLS's 2–3.
- **Connection migration** — QUIC identifies a connection by an ID, not by IP+port. **Walk from wifi to 5G and your connection survives** instead of dropping. (TCP would break — the IP changed.)
- **Always encrypted** — TLS 1.3 is mandatory.

## Comparison

| | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|---|---|---|
| Transport | TCP | TCP | **QUIC (UDP)** |
| Format | Text | Binary | Binary |
| Concurrency | 1 per connection (~6 conns) | Multiplexed | Multiplexed |
| HTTP head-of-line | ❌ Yes | ✅ Fixed | ✅ Fixed |
| **TCP** head-of-line | ❌ Yes | ❌ **Still yes** | ✅ **Fixed** |
| Header compression | ❌ | ✅ HPACK | ✅ QPACK |
| Handshake | TCP + TLS (2–3 RTT) | TCP + TLS | **1-RTT / 0-RTT** |
| Survives network change | ❌ | ❌ | ✅ |

## What this means for you

The good news: **you rarely implement any of this.** Your reverse proxy, CDN, or cloud load balancer terminates HTTP/2 and HTTP/3 and speaks plain HTTP to your app. Turning it on is usually a config flag.

But it changes your *decisions*:

- ✅ **Enable HTTP/2 (and HTTP/3)** at the edge — it's usually one line in Nginx/Caddy/Cloudflare.
- ✅ **Stop bundling everything into one giant file** — with multiplexing, smaller cacheable chunks win.
- ✅ **Stop domain sharding** — it now *hurts* (it defeats the single-connection benefit).
- ✅ **Keep headers/cookies small** — they're compressed, but they still travel.

## Key takeaways

- **HTTP/1.1**: one request at a time per connection → **head-of-line blocking**, worked around with bundling/sharding.
- **HTTP/2**: **multiplexes** many streams over one connection + binary framing + header compression. Makes bundling and sharding obsolete.
- HTTP/2 still suffers **TCP-level** head-of-line blocking — one lost packet stalls every stream.
- **HTTP/3** runs on **QUIC/UDP**: per-stream recovery, **1-RTT/0-RTT** handshakes, and connections that **survive a network switch**.
- The semantics never changed — only the wire format. Enable it at the edge and drop the HTTP/1 hacks.

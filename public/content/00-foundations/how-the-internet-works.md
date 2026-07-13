# How the Internet Works

Before you can build servers, you need a mental model of how a message gets from one computer to another across the world. It's simpler than it looks — and once it clicks, a lot of backend mysteries stop being mysterious.

## Everything is just computers talking

The internet is a giant network of computers that agree on **protocols** — shared rules for how to talk. When your browser loads a page, it's really one computer (the **client**) asking another computer (the **server**) for some data.

There's no magic cloud. There is a **physical machine**, somewhere, with an address, running a program that answered you.

## Data travels in packets

Your request isn't sent as one big blob. It's chopped into small **packets**, each labelled with where it's going. Packets travel independently, hop by hop, across many routers — and are reassembled at the destination.

> **Analogy:** You want to mail a 500-page book. Instead of one huge parcel, you tear out the pages, number them, and post each in its own envelope. They may take different routes and arrive out of order — the recipient reorders them by number. If page 237 gets lost, you only re-send *that page*, not the whole book.

Two packets from the *same* request can genuinely take *different physical routes* across the planet and still arrive fine.

## The layers

Each layer has one job and trusts the layer below it. This is the single most useful diagram in networking:

```
   You type a URL
         │
      HTTP        ← the language of the web (requests / responses)
         │           "GET /products"
      TLS         ← encryption (the "S" in HTTPS)
         │           scrambles it so nobody can read it
      TCP         ← reliable delivery: ordering + retransmit lost packets
         │           "did page 237 arrive? no? send it again"
       IP         ← addressing: which machine, via which route
         │           "deliver to 93.184.216.34"
    physical      ← cables, wifi, fibre, radio
```

**Why layers matter to you:** as a backend dev you live almost entirely at the **HTTP** layer. You get to *assume* the bytes arrive, in order, encrypted, at the right machine — because TCP, TLS, and IP already solved that. Layering is what makes your job possible.

## TCP vs UDP

The two ways to send packets, and the trade-off is exactly what you'd guess:

| | **TCP** | **UDP** |
|---|---|---|
| Delivery | ✅ Guaranteed, in order | ❌ Fire-and-forget |
| Lost packets | Automatically re-sent | Just... gone |
| Speed | Slower (handshake + acks) | ⚡ Fast, no overhead |
| Used by | **HTTP, databases, email** — almost everything you'll build | Video calls, live streaming, games, DNS |

**Why would anyone choose UDP?** Because on a video call, a re-sent packet from 2 seconds ago is *useless* — the moment has passed. A brief glitch is better than a growing delay. But for a bank transfer, you'd very much like every byte to arrive.

> **Default to TCP.** It's what HTTP uses, so you get it for free. (Fun fact: HTTP/3 finally *does* use UDP — but rebuilds reliability on top. More on that later.)

## What actually happens when you visit a site

Let's trace `https://example.com` end to end. **Every step here is a lesson later in this roadmap:**

```
1. DNS      "example.com" → 93.184.216.34
            (your computer asks a DNS server for the IP)         → Lesson: DNS

2. TCP      open a connection to 93.184.216.34 on port 443
            (the "three-way handshake": SYN → SYN-ACK → ACK)

3. TLS      agree on encryption; the server proves its identity
            with a certificate                                   → Lesson: TLS

4. HTTP     send:  GET / HTTP/1.1
                   Host: example.com                             → Lesson: HTTP

5. SERVER   receives it, runs YOUR CODE, queries a database,
            builds a response                                    → ← your job!

6. HTTP     respond: 200 OK + the HTML

7. RENDER   packets arrive, TCP reassembles them, the browser
            paints the page
```

All of that, typically, in **under 200 milliseconds**.

> 🔑 Notice step 5. **That is the entire subject of this roadmap.** Steps 1–4 and 6–7 are handled for you by the internet, the OS, and the browser. Your job is to be the program that wakes up at step 5 and answers well.

## Latency: the thing you cannot optimize away

One number will shape more of your design decisions than any other:

```
Round trip within a datacenter        ~0.5 ms
Round trip London → New York         ~70 ms
Round trip London → Sydney          ~250 ms
```

Light in fibre is *fast*, but it is not infinite — and **you cannot make it faster**. No amount of clever code beats the speed of light.

This is why:
- **Fewer round trips beat faster code.** One request that fetches everything beats ten that each fetch a piece. (Remember this when we hit the *N+1 query problem* — it's the same idea.)
- **CDNs exist** — put a copy of the data physically closer to the user.
- **Caching wins** — the fastest request is the one you never make.

## Common misconceptions

**❌ "The cloud is not a real place."** It absolutely is. It's a warehouse full of computers in Virginia, or Dublin, or Singapore — and how far your user is from it is a real cost.

**❌ "The internet and the web are the same thing."** The internet is the **network** (the roads). The web is **one thing built on it** (HTTP traffic). Email, video calls, and games also use the internet without touching the web.

**❌ "HTTPS makes my app secure."** It makes the *connection* private. It does nothing about SQL injection, weak passwords, or broken permissions. Encryption in transit is one layer, not the whole story.

## Key takeaways

- The internet = computers following **shared protocols**. There's no magic — just a real machine that answered you.
- Data moves as small, independently-routed **packets**, reassembled at the destination.
- **Layers**: IP addresses, TCP delivers reliably, TLS encrypts, HTTP speaks. Each trusts the one below — which is *why* you get to work at the HTTP layer.
- **TCP** = reliable and ordered (use this). **UDP** = fast and lossy (video, games).
- **Latency is physics.** Fewer round trips beat faster code — the single most important performance idea in backend.

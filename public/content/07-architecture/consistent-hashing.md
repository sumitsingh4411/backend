# Consistent Hashing

A small, elegant algorithm that quietly powers Redis clusters, CDNs, Cassandra, DynamoDB, and every large distributed cache. It solves one very specific — and very expensive — problem.

## The problem: `hash(key) % N`

You have 4 cache servers. The obvious way to pick one:

```js
const server = hash(key) % 4;      // → 0, 1, 2, or 3
```

Simple, fast, evenly distributed. Perfect.

**Then you add a fifth server.** `N` changes from 4 to 5, so every key's destination is recomputed:

```
key "user:1"   hash=100 →  100 % 4 = 0  ⟶  100 % 5 = 0   ✅ same
key "user:2"   hash=101 →  101 % 4 = 1  ⟶  101 % 5 = 1   ✅ same
key "user:3"   hash=102 →  102 % 4 = 2  ⟶  102 % 5 = 2   ✅ same
key "user:4"   hash=103 →  103 % 4 = 3  ⟶  103 % 5 = 3   ✅ same
key "user:5"   hash=104 →  104 % 4 = 0  ⟶  104 % 5 = 4   ❌ MOVED
key "user:6"   hash=105 →  105 % 4 = 1  ⟶  105 % 5 = 0   ❌ MOVED
```

Do the math across all keys and roughly **80% of them now map to a different server.**

### Why that's a catastrophe

Every one of those keys is now a **cache miss**. Your carefully warmed cache is effectively wiped, and 80% of traffic slams into the database simultaneously.

> **Adding one server to relieve load can take your database down.** That is a genuinely nasty failure mode — and it's why you can't just `% N`.

The same happens when a server *dies*, which is worse: you didn't choose the timing.

## The insight

We want a mapping where **adding or removing a server only moves the keys that belong to that server** — not everything.

## The solution: a hash ring

Imagine the entire hash space (say `0` to `2³²`) bent into a **circle**.

1. **Place the servers on the ring** by hashing their names.
2. **Place the keys on the ring** by hashing the keys.
3. **A key belongs to the first server found walking clockwise** from the key's position.

```
                 0 / 2³²
                    │
         ServerA ●──┴──────╮
              ╱             ╲
     key1 ○  ╱               ╲  ● ServerB
            │                 │
            │                 │  ○ key2
     key4 ○ │                 │
             ╲               ╱
              ╲             ╱   ○ key3
       ServerD ●───────────● ServerC

  key1 → walks clockwise → ServerB
  key2 → walks clockwise → ServerC
  key3 → walks clockwise → ServerC
  key4 → walks clockwise → ServerA
```

## Now watch what happens when a server dies

**ServerC fails.** Its keys (key2, key3) now walk further clockwise to **ServerD**.

**Every other key is untouched.** key1 still goes to ServerB. key4 still goes to ServerA. Only ServerC's share had to move.

```
Rehashing with % N   :  ~80% of keys move  💥
Consistent hashing   :  ~1/N of keys move  ✅
```

With 10 servers, removing one moves only ~10% of the keys instead of ~90%. **That's the entire point.**

Adding a server is the mirror image: the new server slots onto the ring and steals only the keys in the arc immediately before it.

## The catch — and virtual nodes

With one point per server, the ring is **lumpy**. Random hashing might put three servers close together, leaving one server responsible for a huge arc:

```
ServerA ●●● ServerB, ServerC clustered here
        │
        │       ← ServerD alone owns this ENORMOUS arc
        │          → it gets most of the keys 🔥
   ServerD ●
```

And when a server dies, **all** its keys go to exactly one neighbour — potentially overloading it and causing a cascading failure.

### The fix: virtual nodes (vnodes)

Place each server on the ring at **many** positions (typically 100–200), by hashing `serverA#1`, `serverA#2`, … `serverA#150`.

```
Ring with virtual nodes (each server appears many times):
  A₁ B₇ D₃ C₂ A₉ D₁ B₄ C₈ A₅ C₃ B₂ D₇ ...
     ↑ interleaved everywhere
```

Now:
- ✅ **Load is smooth** — the law of large numbers evens out the arcs.
- ✅ When a server dies, its many small arcs are inherited by **many different servers**, spreading the extra load instead of dumping it on one victim.
- ✅ You can give a beefier machine **more vnodes** — weighted distribution for free.

## Implementation

```js
import crypto from "node:crypto";

class ConsistentHash {
  constructor(servers = [], vnodes = 150) {
    this.vnodes = vnodes;
    this.ring = new Map();     // hash → server
    this.sorted = [];          // sorted hashes, for binary search
    servers.forEach((s) => this.addServer(s));
  }

  hash(key) {
    return parseInt(
      crypto.createHash("md5").update(key).digest("hex").slice(0, 8),
      16,
    );
  }

  addServer(server) {
    for (let i = 0; i < this.vnodes; i++) {
      const h = this.hash(`${server}#${i}`);   // many points per server
      this.ring.set(h, server);
    }
    this.sorted = [...this.ring.keys()].sort((a, b) => a - b);
  }

  removeServer(server) {
    for (let i = 0; i < this.vnodes; i++) {
      this.ring.delete(this.hash(`${server}#${i}`));
    }
    this.sorted = [...this.ring.keys()].sort((a, b) => a - b);
  }

  getServer(key) {
    if (!this.sorted.length) return null;
    const h = this.hash(key);

    // walk clockwise: first ring point >= h  (binary search)
    let lo = 0, hi = this.sorted.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.sorted[mid] < h) lo = mid + 1;
      else hi = mid;
    }
    // wrap around the circle if we ran off the end
    const idx = this.sorted[lo] >= h ? lo : 0;
    return this.ring.get(this.sorted[idx]);
  }
}

const ring = new ConsistentHash(["cache-1", "cache-2", "cache-3"]);
ring.getServer("user:42");     // → "cache-2"
ring.removeServer("cache-2");  // only cache-2's keys move
ring.getServer("user:42");     // → "cache-3"
```

Lookup is **O(log n)** via binary search.

## Where it's used

- **Redis Cluster** — 16,384 hash slots distributed across nodes (a fixed-slot variant of the same idea).
- **Cassandra / DynamoDB** — partition data across the ring; also used to pick **replica** nodes (the next N servers clockwise).
- **CDNs** — route a URL to the edge node that already has it cached.
- **Load balancers** — sticky routing (`ip_hash`) so a client keeps landing on the same server.
- **Sharded databases** — decide which shard a row lives on, so adding a shard doesn't reshuffle everything.

> Notice the pattern: any time you must map **keys → a changing set of nodes**, this is the tool.

## Key takeaways

- **`hash(key) % N` is a trap:** changing `N` remaps ~*all* keys → a total cache wipe and a database stampede, exactly when you're already under pressure.
- **Consistent hashing** maps keys and servers onto a **ring**; a key belongs to the first server **clockwise**.
- Adding/removing a server moves only **~1/N of keys** instead of nearly all of them.
- **Virtual nodes** (100–200 points per server) are essential — they even out the load and spread a failed server's keys across many survivors instead of one.
- It powers Redis Cluster, Cassandra, DynamoDB, and CDNs. Lookup is O(log n).

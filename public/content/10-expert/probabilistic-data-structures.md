# Bloom Filters & Probabilistic Structures

What if you could answer *"have I seen this before?"* for **a billion items using 1 GB… or for the same billion items using 1 GB less**, by accepting a tiny, controlled error rate?

That's the trade these structures make: **give up perfect accuracy, gain enormous savings in memory.** It's one of the most elegant ideas in systems engineering.

---

# Part 1: Bloom Filters

## The problem

You have 1 billion URLs already crawled. A new URL arrives — have you seen it?

```js
const seen = new Set();     // ❌ 1 billion URLs × ~60 bytes ≈ 60 GB of RAM
if (seen.has(url)) skip();
```

A hash set is **exact**, but it must store every item. That doesn't fit in memory.

## The insight

You don't actually need to store the items. You just need to answer a **yes/no question** — and you're willing to be occasionally wrong *in one specific, safe direction*.

## How it works

A **bit array** (all zeros) and **k independent hash functions**.

**To add "apple":** hash it k times, set those bits to 1.

```
hash1("apple") = 3     hash2("apple") = 7     hash3("apple") = 11

index:  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14
bits:  [0][0][0][1][0][0][0][1][0][0][0][1][0][0][0]
                 ▲           ▲           ▲
```

**To query "apple":** hash it k times, check those bits.

```
All three bits are 1  →  "PROBABLY present"
```

**To query "banana":**

```
hash1=2, hash2=7, hash3=13
bits:  [0][0][0]... index 2 = 0  ← ✋ a ZERO!

→ "DEFINITELY NOT present"
```

## 🔑 The magic: one-sided error

This is the entire point, and it's why Bloom filters are useful rather than merely cute:

| Answer | Meaning | Certainty |
|---|---|---|
| **"No"** | **Definitely not in the set** | ✅ **100% certain** |
| **"Yes"** | *Probably* in the set | ⚠️ Might be a **false positive** |

- ✅ **Never a false negative.** If it says no, it is *genuinely* not there — because adding it would have set those bits.
- ⚠️ **False positives are possible.** Other items may have coincidentally set all of "banana's" bits.

**Why that asymmetry is so useful:** a "no" lets you **skip an expensive operation with total confidence**. A "maybe" just costs you one real lookup — which you'd have done anyway. **You can only ever win.**

## The numbers

```
1 billion items, 1% false positive rate  →  ~1.2 GB
1 million items,  1% false positive rate →  ~1.2 MB   (vs ~60 MB for a hash set)
1 million items, 0.1% false positive rate →  ~1.8 MB
```

**~10 bits per item for a 1% error rate — regardless of how big each item is.** A 2 KB URL and a 4-byte integer cost the same. Memory depends only on the *count*, not the size.

Tune it with two knobs:
- **m** (bits) — more bits, fewer collisions
- **k** (hash functions) — optimal is `k = (m/n) × ln2`

## Implementation

```js
class BloomFilter {
  constructor(size = 1_000_000, k = 7) {
    this.size = size;
    this.k = k;
    this.bits = new Uint8Array(size);   // 1 byte per slot (a real one packs bits)
  }

  *hashes(item) {
    let h1 = fnv1a(item);
    let h2 = fnv1a(item + "salt");
    for (let i = 0; i < this.k; i++) {
      // double hashing: derive k hashes from 2 — a standard trick
      yield Math.abs((h1 + i * h2) % this.size);
    }
  }

  add(item) {
    for (const h of this.hashes(item)) this.bits[h] = 1;
  }

  mightContain(item) {
    for (const h of this.hashes(item)) {
      if (this.bits[h] === 0) return false;   // ✅ DEFINITELY not present
    }
    return true;                              // ⚠️ probably present
  }
}

const seen = new BloomFilter();
seen.add("https://example.com");
seen.mightContain("https://example.com");  // true  (correct)
seen.mightContain("https://other.com");    // false (definitely new) ✅
```

⚠️ **You cannot delete from a Bloom filter.** Clearing a bit might break *other* items that share it. (Use a **Counting Bloom filter** — counters instead of bits — if you need deletion.)

## Where it's actually used

- **🗄️ LSM-tree databases (Cassandra, RocksDB, HBase)** — *the* killer application. Before reading an SSTable from **disk**, check its Bloom filter. "Definitely not here" → **skip the disk read entirely.** This single trick is what makes LSM reads viable (recall the read-amplification problem from the last lesson).
- **🌐 CDNs** — "don't cache this until it's been requested twice" (cheap way to avoid caching one-hit-wonders).
- **🔐 Chrome's malicious-URL check** — Chrome can't ship a list of every bad URL. It ships a Bloom filter. "Not in it" → safe, no network call (the common case). "Maybe" → *then* ask the server. Privacy and speed, together.
- **🛡️ Cache penetration defence** — remember that attack from the caching lesson (requests for keys that don't exist, sailing past the cache into the DB)? A Bloom filter of existing IDs rejects them at the door.
- **📧 Weak-password / breached-password checks.**

---

# Part 2: HyperLogLog — counting unique things

## The problem

*"How many **unique** visitors did we get today?"* — 100 million page views.

```js
const uniques = new Set();          // ❌ must store every visitor ID
views.forEach((v) => uniques.add(v.userId));
uniques.size;                       // exact… but gigabytes of RAM
```

Counting **distinct** items (cardinality) *seems* to require remembering every item you've seen. Multiply that by "per day, per page, per country" and you're out of memory.

## The trick

HyperLogLog exploits a beautiful statistical property. Hash each item to a random-looking bit string and watch the **leading zeros**.

- In random data, a hash starting with **1 zero** happens ~1/2 the time.
- **2 zeros** → ~1/4 of the time.
- **10 zeros** → ~1/1024 of the time.

> So if the **most leading zeros you've ever seen is 10**, you've *probably* seen around **2¹⁰ ≈ 1,024 distinct items.**

That's it. You don't store the items — **you store one number**: the longest run of zeros seen. HyperLogLog refines this by splitting the hash into many "buckets" and averaging (harmonically), which crushes the variance.

```
Result: count billions of unique items in ~12 KB, with ~0.81% error.
```

**Twelve kilobytes.** Not gigabytes.

```bash
# Redis has it built in
PFADD visitors:2026-07-12 user:1 user:2 user:3
PFCOUNT visitors:2026-07-12          # → ~3  (estimate, 12KB fixed)

# And you can MERGE them — this is the superpower
PFMERGE visitors:july visitors:2026-07-01 visitors:2026-07-02 ...
PFCOUNT visitors:july   # unique visitors across the whole month
```

> **Mergeability is the killer feature.** You cannot add up daily unique-visitor *counts* to get the monthly figure (that would double-count returning users). But you **can** merge HLLs — and get the correct distinct count. Every analytics system relies on this.

**Use when:** an estimate is fine. Unique visitors, distinct search terms, unique IPs. **Don't use when:** you need the exact number (billing, compliance).

---

# Part 3: The rest of the family

| Structure | Question it answers | Cost |
|---|---|---|
| **Bloom filter** | "Have I seen this?" | ~10 bits/item, false positives |
| **Cuckoo filter** | Same, **but supports deletion** | Slightly more space |
| **HyperLogLog** | "How many *unique*?" | ~12 KB, ~1% error |
| **Count-Min Sketch** | "How *often* has X appeared?" (frequency) | Fixed, **over**-estimates |
| **Top-K / Heavy Hitters** | "What are the most frequent items?" | Fixed |
| **t-digest** | "What's the **p99**?" (quantiles) | Tiny, mergeable |

**Count-Min Sketch** deserves a mention: it tracks frequencies in fixed memory. It's how you find the "heavy hitters" hammering your API, or trending hashtags, without storing a counter for every possible key.

**t-digest** is how your monitoring system computes **p99 latency** across a fleet without shipping every raw measurement — and, crucially, **the sketches merge**, so you can combine them across servers.

---

## The unifying idea

Every one of these makes the same bargain:

> **Trade a small, *bounded*, *quantifiable* error for a massive reduction in memory — and, usually, for mergeability.**

The engineering skill isn't memorizing them. It's recognizing the moment when you catch yourself saying *"I need to store every item just to answer this one question"* — and asking:

**"Do I actually need an exact answer here?"**

Surprisingly often, you don't. And when you don't, these structures turn an impossible problem into a trivial one.

## Key takeaways

- **Bloom filter:** "have I seen this?" in **~10 bits per item**. **"No" is 100% certain; "yes" might be a false positive** — never a false negative. That one-sided error is what makes it safe: a "no" lets you skip expensive work with total confidence.
- It's the reason **LSM-tree reads are fast** (skip SSTables without touching disk), and it defends against **cache penetration**. You can't delete from one (use a Counting/Cuckoo filter).
- **HyperLogLog:** count **billions of unique items in ~12 KB** with ~1% error — and HLLs **merge**, which counts of uniques cannot.
- **Count-Min Sketch** (frequencies), **t-digest** (p99 quantiles, mergeable) round out the family.
- The pattern: whenever you think *"I must store everything to answer this,"* ask **"do I need an exact answer?"** If not, a probabilistic structure makes an impossible problem cheap.

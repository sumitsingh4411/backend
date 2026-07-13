# API Design, Pagination & Versioning

REST tells you the *shape*. This lesson is about the decisions that make an API **pleasant to use and possible to evolve** — the stuff that separates a hobby API from Stripe's.

## 1. Consistency beats cleverness

Pick conventions and never deviate. A predictable API means developers can *guess* correctly.

```
✅ /users  /users/5  /users/5/orders        plural, lowercase, kebab-case
❌ /user   /getUsers  /Users/5  /user_list  ← four styles, one API. Chaos.
```

Decide once: plural nouns · `snake_case` **or** `camelCase` in JSON (pick one!) · ISO-8601 timestamps · IDs as strings.

## 2. Return consistent, useful errors

Nothing is worse than an API that returns `500 "error"`. Give clients something to act on:

```json
{
  "error": {
    "code": "validation_failed",      // stable, machine-readable
    "message": "Email is not valid.", // human-readable
    "details": [
      { "field": "email", "issue": "invalid_format" }
    ],
    "request_id": "req_8f3a2b"        // 🔑 so you can find it in your logs
  }
}
```

- **`code`** is stable — clients branch on it. Never make them parse `message`.
- **`request_id`** lets a user report "request req_8f3a2b failed" and you find it instantly.

## 3. Pagination: never return an unbounded list

`GET /users` on a table with 5 million rows will kill your server *and* the client. **Always paginate**, and always cap the page size.

### Offset pagination (the naive one)

```
GET /users?page=3&limit=20     →  SQL: LIMIT 20 OFFSET 40
```

✅ Simple, lets you jump to any page.
❌ **It gets slower the deeper you go.** `OFFSET 100000` forces the database to walk past 100,000 rows and *throw them away* before returning anything.
❌ **It's unstable.** If a row is inserted while the user pages, items shift and they'll see a duplicate — or **miss** one entirely.

### ✅ Cursor (keyset) pagination — what real APIs use

Instead of "skip 40," say **"give me what comes after this exact item."**

```
GET /users?limit=20&after=eyJpZCI6MTIzfQ

-- SQL: seek directly, no scanning
SELECT * FROM users
WHERE (created_at, id) < ('2026-07-01', 4821)   -- the cursor
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

✅ **Constant time at any depth** — the index seeks straight to the position.
✅ **Stable** — inserts don't shift your window.
❌ No jumping to "page 500" (which nobody actually does anyway).

```json
{
  "data": [ … ],
  "next_cursor": "eyJpZCI6MTQzfQ",   // opaque — clients must not parse it
  "has_more": true
}
```

> **Rule:** offset is fine for a small admin table. **Anything user-facing or large → cursor.**

## 4. Filtering, sorting, sparse fields

```
GET /articles?status=published&sort=-created_at&fields=id,title&limit=20
```

- `sort=-created_at` — the `-` prefix means descending.
- `fields=` — let clients ask for less (a poor man's GraphQL; saves real bandwidth).

## 5. Versioning: the hard part

Your API will change. Existing clients (a mobile app you can't force-update) must **not break**.

### What's actually a breaking change?

| Safe (additive) ✅ | Breaking ❌ |
|---|---|
| Adding a new endpoint | Removing an endpoint |
| Adding an **optional** field to a response | Removing/renaming a field |
| Adding an optional request param | Making an optional param required |
| Adding a new enum value* | Changing a field's type |
| | Changing error codes or status codes |

> \*Adding an enum value can still break a strict client. Document that clients must tolerate unknown values.

**The rule: you can always add. You can never take away.**

### How to version

**URL path (recommended — pick this):**
```
/v1/users
/v2/users
```
✅ Obvious, easy to route, easy to cache, trivial to test in a browser. It's what Stripe, GitHub, and Twilio effectively do.
❌ Purists complain it's "not RESTful." Ignore them; ship it.

**Header versioning:**
```http
Accept: application/vnd.myapi.v2+json
```
✅ Keeps URLs clean. ❌ Invisible, harder to debug and cache.

### The real strategy: avoid v2 as long as possible

Every version you support is a version you must **maintain, test, and secure — forever**. Two live versions is double the work.

So:
1. **Design additively.** Add fields; don't remove them.
2. When you must break: ship `/v2`, keep `/v1` alive, and **announce a deprecation date**.
3. Signal it in the response so nobody is surprised:

```http
Deprecation: true
Sunset: Sat, 31 Dec 2026 23:59:59 GMT
Link: <https://docs.example.com/migrate-v2>; rel="deprecation"
```
4. **Measure who's still on v1** (log the version per request). You cannot retire what you can't see.

## 6. Document it — and generate the docs

Write an **OpenAPI** spec. From one YAML file you get interactive docs, client SDKs in every language, and request validation.

> An undocumented API doesn't really exist.

## Key takeaways

- **Be relentlessly consistent** — plural nouns, one casing, ISO timestamps.
- Return **structured errors** with a stable `code` and a `request_id`.
- **Always paginate.** Offset degrades and skips rows; **cursor pagination** is O(1) at any depth and stable.
- **Additive changes are safe; removals and renames break clients.** Version in the URL (`/v1`), and design additively so you rarely need `/v2`.
- Deprecate loudly (`Sunset` header + measured usage), and describe everything in **OpenAPI**.

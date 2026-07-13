# Testing Backends

Tests aren't about proving your code works today. They're about being able to **change it tomorrow without fear**. A backend without tests calcifies: nobody dares touch it.

## The test pyramid

```
        ╱  E2E  ╲          few — slow, brittle, but highest confidence
      ╱───────────╲
    ╱ Integration  ╲       some — real DB, real HTTP
  ╱─────────────────╲
╱      Unit          ╲     many — fast, focused, cheap
──────────────────────
```

**Many fast unit tests, some integration tests, few E2E tests.** Inverting this ("the ice cream cone") gives you a slow, flaky suite that everyone learns to ignore.

## 1. Unit tests — logic in isolation

Test one function's logic with no database, no network. Milliseconds each.

```js
// Pure logic → trivial to test
test("applies a 10% discount over $100", () => {
  expect(calculateTotal({ subtotal: 200, coupon: "SAVE10" })).toBe(180);
  expect(calculateTotal({ subtotal: 50,  coupon: "SAVE10" })).toBe(50);  // under threshold
});
```

> **Design insight:** if something is hard to unit-test, that's usually a *design* signal. Pull business logic out of your route handlers into plain functions and it becomes easy. Testability and good architecture are the same thing.

## 2. Integration tests — the sweet spot for backends

Test that your code works **with a real database** and real HTTP. This is where the highest-value backend bugs are caught (bad SQL, wrong status codes, broken auth).

```js
// Hit the real API against a real (test) database
test("POST /users creates a user", async () => {
  const res = await request(app)
    .post("/users")
    .send({ email: "ada@x.com", password: "secret123" });

  expect(res.status).toBe(201);
  expect(res.body.id).toBeDefined();
  expect(res.body.password).toBeUndefined();     // 🔒 never leak the password!

  const inDb = await db.users.findByEmail("ada@x.com");
  expect(inDb).toBeTruthy();
});

test("rejects a duplicate email", async () => {
  await createUser({ email: "ada@x.com" });
  const res = await request(app).post("/users").send({ email: "ada@x.com", password: "x" });
  expect(res.status).toBe(409);                  // Conflict
});
```

**Use a real database, not mocks.** Spin up Postgres in Docker (or Testcontainers). Mocking your DB tests your mocks, not your SQL — and SQL is exactly where the bugs live.

## 3. E2E tests — the critical paths only

Drive the whole system like a user (signup → login → checkout). Slow and brittle, so keep them **few**: cover the flows where a failure would be catastrophic.

## What to actually test (a checklist)

- ✅ **The happy path.**
- ✅ **Error cases** — invalid input → 400, missing → 404, duplicate → 409.
- ✅ **Auth** — unauthenticated → 401; wrong user → 403. *Test that user A cannot read user B's data.* **This is the test that prevents real breaches.**
- ✅ **Edge cases** — empty lists, zero, negative numbers, huge payloads, unicode.
- ✅ **Idempotency** — send the same request twice; assert it doesn't double-charge.
- ❌ Don't test the framework or the library. Test *your* logic.

## Keeping tests trustworthy

- **Isolate every test.** Each starts from a known state (a transaction rolled back after each test is a fast, clean trick). Tests that pass alone but fail together are a nightmare.
- **No shared mutable state, no test ordering dependencies.**
- **Kill flakiness immediately.** A suite that fails randomly trains everyone to ignore red — and then a real failure slips through. A flaky test is worse than no test.
- **Don't chase 100% coverage.** Coverage shows what *ran*, not what's *verified*. 70% on meaningful paths beats 100% of trivial getters.

## Other testing you should know

- **Load testing** (k6, Locust) — how does it behave at 10× traffic? Find the breaking point *before* users do.
- **Contract testing** (Pact) — for microservices: prove a service still satisfies what its consumers expect.
- **Chaos testing** — deliberately kill a dependency and confirm you degrade gracefully rather than collapse.

## Key takeaways

- **Pyramid:** many unit, some integration, few E2E. Inverting it makes a slow, ignored suite.
- **Integration tests with a real database** are the highest-value tests in backend.
- Always test **authorization** (user A must not read user B's data), error codes, and **idempotency**.
- **Isolate tests**, eliminate **flakiness**, and don't worship coverage — if code is hard to test, fix the **design**.

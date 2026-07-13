# Authentication vs Authorization

Two words that sound alike, get abbreviated confusingly (**authn** / **authz**), and mean completely different things. Getting them straight is step one of backend security.

## The distinction

- **Authentication (authn)** — *Who are you?* Proving identity. Logging in.
- **Authorization (authz)** — *Are you allowed to do this?* Checking permissions.

> **Analogy:** At an airport, **authentication** is showing your passport at check-in — proving you are who you claim. **Authorization** is your boarding pass — it says *which* flight and *which* seat you may take. Being identified doesn't mean you can sit in first class.

Authentication always comes **first**; authorization happens on **every** protected action.

## In HTTP terms

- **401 Unauthorized** → authentication failed. "I don't know who you are." → log in.
- **403 Forbidden** → authorization failed. "I know you, but no." → you lack permission.

(Yes, 401 is misnamed — it really means *unauthenticated*.)

## The flow

```
1. POST /login  { email, password }     ← authentication
   → server verifies, returns a token/cookie

2. DELETE /articles/42                  ← authorization
   Authorization: Bearer <token>
   → server: "Is this user the author or an admin?"
      yes → 204     no → 403
```

## Authorization models

- **RBAC (Role-Based)** — permissions attach to roles: `admin`, `editor`, `viewer`. Simple and most common.
- **ABAC (Attribute-Based)** — rules over attributes: "can edit if `article.authorId == user.id`". More flexible.
- **Ownership checks** — the everyday case: does this resource belong to this user?

```js
// A typical authorization check
app.delete("/articles/:id", requireAuth, async (req, res) => {
  const article = await db.articles.find(req.params.id);
  if (!article) return res.status(404).end();

  const isOwner = article.authorId === req.user.id;
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  await db.articles.delete(article.id);
  res.status(204).end();
});
```

## The mistake that causes real breaches

Checking authorization on the **frontend only** — hiding the delete button but leaving the endpoint open. An attacker just calls the API directly.

**Every protected endpoint must re-check permissions on the server, every time.** Hiding a button is UX, not security.

## Key takeaways

- **Authentication** = who you are. **Authorization** = what you may do.
- 401 = not authenticated; 403 = authenticated but not permitted.
- Common models: RBAC (roles), ABAC (attributes), and ownership checks.
- Never rely on the UI to enforce permissions — always check server-side.

# REST in Depth

**REST** is the most common way to design HTTP APIs. It's a set of conventions, not a strict standard — but following them makes your API predictable, and predictable APIs are a joy to use.

## The core idea: resources as nouns

Model your API around **resources** (nouns), and use **HTTP methods** (verbs) to act on them. The URL names the *thing*; the method says what to *do*.

```
GET    /articles        → list articles
POST   /articles        → create an article
GET    /articles/42     → read article 42
PUT    /articles/42     → replace article 42
PATCH  /articles/42     → update part of article 42
DELETE /articles/42     → delete article 42
```

Compare that to a non-REST design that stuffs verbs in the URL:

```
❌ /getArticles   /createArticle   /deleteArticleById?id=42
✅ GET /articles  POST /articles   DELETE /articles/42
```

The RESTful version is smaller, consistent, and self-explanatory.

## Nested resources

Express relationships with nesting:

```
GET  /users/7/orders        → orders belonging to user 7
POST /users/7/orders        → create an order for user 7
GET  /articles/42/comments  → comments on article 42
```

Don't nest more than ~2 levels deep — it gets unwieldy. Beyond that, use query parameters.

## Query parameters for filtering, sorting, paging

```
GET /articles?tag=backend&sort=-createdAt&page=2&limit=20
```

Keep these for *how* you want the collection, not *which* resource.

## Design principles

- **Use the right status codes** — 201 on create, 404 when missing, 400 on bad input.
- **Be consistent** — plural nouns (`/users`), same casing everywhere.
- **Stateless** — every request carries its own auth; the server holds no session about "where you were."
- **Return the resource** — after POST/PUT, return the created/updated object.
- **Version your API** — `/v1/...` so you can evolve without breaking clients.

## A clean endpoint

```js
// JavaScript (Express)
app.get("/articles/:id", async (req, res) => {
  const article = await db.articles.find(req.params.id);
  if (!article) return res.status(404).json({ error: "Not found" });
  res.json(article);
});

app.post("/articles", async (req, res) => {
  const created = await db.articles.create(req.body);
  res.status(201).location(`/articles/${created.id}`).json(created);
});
```

## Key takeaways

- REST = **resources (nouns) + HTTP methods (verbs)**.
- URLs name things (`/users/5`); methods say what to do.
- Use proper status codes, plural consistent nouns, and query params for filtering/paging.
- Stay stateless and version your API from day one.

# What is an API?

**API** = Application Programming Interface. It's the **contract** for how one piece of software talks to another: *"send me a request shaped like this, and I'll respond like that."*

You already use APIs constantly. When your frontend does `fetch("/api/products")`, it's calling your backend's API.

> **Analogy:** A restaurant menu. It lists what you can order and what you'll get — without showing you the kitchen. You don't need to know *how* the dish is made, only how to order it. The menu is the API.

## Why APIs matter

An API is a **boundary**. Behind it, you can rewrite the database, change languages, or refactor everything — and as long as the contract stays the same, every client keeps working. That decoupling is what lets big systems evolve.

## The contract has parts

For an HTTP API, the contract specifies:

- **Endpoints** — the URLs (`/products`, `/users/42`).
- **Methods** — GET/POST/etc. for each endpoint.
- **Request shape** — required params, headers, body format.
- **Response shape** — status codes and the JSON structure returned.
- **Errors** — what failures look like.

## Calling one

```js
// JavaScript
const res = await fetch("https://api.example.com/products");
const products = await res.json();
```

```python
# Python (requests)
import requests
products = requests.get("https://api.example.com/products").json()
```

```go
// Go
resp, _ := http.Get("https://api.example.com/products")
defer resp.Body.Close()
var products []Product
json.NewDecoder(resp.Body).Decode(&products)
```

```java
// Java (HttpClient)
HttpResponse<String> resp = HttpClient.newHttpClient().send(
    HttpRequest.newBuilder(URI.create("https://api.example.com/products")).build(),
    HttpResponse.BodyHandlers.ofString());
```

## Kinds of APIs

- **REST** — resources over HTTP (the default; next lesson).
- **GraphQL** — one endpoint, clients ask for exact fields.
- **gRPC** — fast binary calls between services.
- **WebSockets** — persistent, real-time, two-way.

They're all "an API" — different shapes of the same idea: a contract for talking to software.

## Key takeaways

- An API is a **contract** for software-to-software communication.
- It hides *how* something works and exposes *how to use it*.
- That boundary lets you change internals without breaking clients.
- REST, GraphQL, gRPC, and WebSockets are different API styles.

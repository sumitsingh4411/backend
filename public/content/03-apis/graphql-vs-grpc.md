# GraphQL & gRPC

REST is the default, but two other API styles solve problems REST struggles with. Knowing when to reach for each is a senior-level skill.

## GraphQL — "ask for exactly what you need"

With REST, an endpoint returns a **fixed** shape. That causes two classic pains:

- **Over-fetching** — `/users/5` returns 30 fields but you needed 2.
- **Under-fetching** — you need a user *and* their posts *and* each post's comments → 3+ round trips.

**GraphQL** exposes a single endpoint and a **schema**. The client sends a query describing exactly the fields (and nested relations) it wants, and gets precisely that back — in one request.

```graphql
# One request gets exactly these fields, nested:
query {
  user(id: 5) {
    name
    posts {
      title
      comments { text }
    }
  }
}
```

- ✅ No over/under-fetching, strongly typed schema, one round trip.
- ❌ Caching is harder (it's usually one POST endpoint), and a naive query can be expensive — you must guard against costly nested queries.

**Use when:** clients have varied, evolving data needs (mobile + web + partners) and you want them to shape their own responses.

## gRPC — "fast calls between services"

**gRPC** is for **service-to-service** communication inside your backend. You define methods and message types in a `.proto` file, and gRPC generates typed client/server code. It sends compact **binary** (Protocol Buffers) over HTTP/2 — much faster and smaller than JSON.

```protobuf
// user.proto — the contract, shared by both services
service UserService {
  rpc GetUser(GetUserRequest) returns (User);
}
message GetUserRequest { int32 id = 1; }
message User { int32 id = 1; string name = 2; }
```

- ✅ Very fast, small payloads, strong typing, streaming, great for microservices.
- ❌ Not human-readable, limited direct browser support, more tooling to set up.

**Use when:** internal microservices talk to each other and you want speed + strict contracts.

## Quick comparison

| | REST | GraphQL | gRPC |
|---|---|---|---|
| Format | JSON | JSON | Binary (Protobuf) |
| Endpoints | many | one | methods |
| Best for | public/CRUD APIs | flexible clients | internal services |
| Human-readable | ✅ | ✅ | ❌ |
| Client picks fields | ❌ | ✅ | ❌ |

## Key takeaways

- **REST** is the sensible default for most public APIs.
- **GraphQL** lets clients request exactly the fields they need — great for varied clients, but caching and query cost need care.
- **gRPC** is fast, binary, strongly-typed — ideal for internal service-to-service calls.
- Pick by *who* the caller is and *what* they need, not by hype.

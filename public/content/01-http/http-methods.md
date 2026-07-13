# HTTP Methods

The **method** (or "verb") tells the server what you want to *do* with a resource. Same URL, different method, different action.

## The core five

| Method | Meaning | Changes data? | Idempotent? |
|---|---|---|---|
| **GET** | Read a resource | No | Yes |
| **POST** | Create a new resource | Yes | No |
| **PUT** | Replace a resource entirely | Yes | Yes |
| **PATCH** | Update part of a resource | Yes | No* |
| **DELETE** | Remove a resource | Yes | Yes |

## Two properties that matter

- **Safe** — doesn't change server state. `GET` is safe; you can call it a million times with no side effects. Never make a GET that deletes something!
- **Idempotent** — calling it repeatedly has the same effect as once. `PUT` and `DELETE` are idempotent (deleting twice still leaves it deleted). `POST` is not — two POSTs create two records.

Why care? Because networks retry failed requests. Idempotent methods are safe to retry; `POST` needs extra care (see *Idempotency* later).

## Routing by method

Real frameworks let you attach different logic to the same path per method:

```js
// JavaScript (Express)
app.get("/users/:id", (req, res) => res.json(getUser(req.params.id)));
app.post("/users", (req, res) => res.status(201).json(createUser(req.body)));
app.delete("/users/:id", (req, res) => { removeUser(req.params.id); res.status(204).end(); });
```

```python
# Python (FastAPI)
@app.get("/users/{id}")
def read(id: int): return get_user(id)

@app.post("/users", status_code=201)
def create(user: User): return create_user(user)

@app.delete("/users/{id}", status_code=204)
def delete(id: int): remove_user(id)
```

```go
// Go (net/http, method switch)
http.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		json.NewEncoder(w).Encode(listUsers())
	case http.MethodPost:
		w.WriteHeader(http.StatusCreated)
	}
})
```

```java
// Java (Spring Boot)
@GetMapping("/users/{id}")
User read(@PathVariable Long id) { return service.get(id); }

@PostMapping("/users")
@ResponseStatus(HttpStatus.CREATED)
User create(@RequestBody User u) { return service.create(u); }
```

## Key takeaways

- The method is the **verb**: GET reads, POST creates, PUT/PATCH update, DELETE removes.
- **GET must be safe** — never change data on a GET.
- **Idempotent** methods (GET/PUT/DELETE) are safe to retry; POST isn't.
- Frameworks route the same path to different handlers per method.

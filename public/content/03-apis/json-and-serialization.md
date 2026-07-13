# JSON & Serialization

Your program holds data as **objects in memory**. To send it over the network, you must turn it into a string of bytes. That conversion is **serialization**; turning it back is **deserialization**. **JSON** is the format almost everyone uses for it.

## The problem serialization solves

An in-memory object (with pointers, methods, types) can't travel over a wire. You need a flat, text representation both sides agree on.

```
in-memory object  ──serialize──▶  "{\"id\":42,\"name\":\"Ada\"}"  ──over network──▶
                                                                   ──deserialize──▶  object
```

## Why JSON won

- **Human-readable** — you can debug it by eye.
- **Universal** — every language parses it.
- **Simple** — objects, arrays, strings, numbers, booleans, null. That's it.

```json
{
  "id": 42,
  "name": "Ada",
  "active": true,
  "roles": ["admin", "editor"],
  "profile": { "city": "London" }
}
```

## Serializing in each language

```js
// JavaScript — built in
const json = JSON.stringify(user);   // object → string
const obj = JSON.parse(json);        // string → object
```

```python
# Python — the json module
import json
text = json.dumps(user)   # dict → string
obj  = json.loads(text)   # string → dict
```

```go
// Go — encoding/json (uses struct tags for field names)
b, _ := json.Marshal(user)          // struct → []byte
var u User; json.Unmarshal(b, &u)   // []byte → struct
```

```java
// Java — Jackson
String json = new ObjectMapper().writeValueAsString(user);
User u = new ObjectMapper().readValue(json, User.class);
```

## Gotchas to know

- **Dates** aren't a JSON type — send ISO strings (`"2026-07-12T10:00:00Z"`).
- **Big numbers** can lose precision in JS (use strings for IDs/money).
- **Never trust incoming JSON** — validate it before using it.
- **Don't leak fields** — password hashes, internal flags shouldn't be serialized to clients.

## Other formats (know they exist)

- **Protocol Buffers / MessagePack** — binary, smaller & faster (used by gRPC).
- **YAML/TOML** — for config, not APIs.
- **XML** — older, verbose, still in some enterprise systems.

## Key takeaways

- **Serialization** = object → transferable string; deserialization = the reverse.
- **JSON** is the default: readable, universal, simple.
- Handle dates as ISO strings; watch number precision; validate input; hide sensitive fields.
- Binary formats (Protobuf) trade readability for speed.

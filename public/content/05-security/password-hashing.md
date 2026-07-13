# Password Hashing

If your database leaks — and databases do leak — the difference between a bad day and a catastrophe is **how you stored passwords**.

## The rules, in order of importance

1. **Never store plaintext passwords.** Ever. If you can read a user's password, so can an attacker.
2. **Never encrypt them.** Encryption is *reversible* — one stolen key and every password is exposed.
3. **Hash them** — with a **slow**, **salted** algorithm designed for passwords.

## Hashing vs encryption

- **Encryption** is two-way: `encrypt(x)` → `decrypt()` → `x`. Good for data you need back.
- **Hashing** is one-way: `hash(x)` → a fixed string that **cannot be reversed**.

You never need to *read* a password — only to check if a submitted one matches. So hash the input and compare hashes. One-way is exactly right.

## Why "slow" is a feature

Fast hashes (MD5, SHA-256) are built for *speed* — a GPU can compute **billions per second**, brute-forcing common passwords in minutes. That makes them **wrong for passwords**.

Password hashes are deliberately **slow and memory-hard**, so each guess costs real time:

- **argon2** — the modern winner (memory-hard). Prefer this.
- **bcrypt** — battle-tested, everywhere, still excellent.
- **scrypt** / **PBKDF2** — also acceptable.

A "work factor" / "cost" parameter lets you make them *slower* as hardware gets faster.

## Salt: why identical passwords must not look identical

A **salt** is a unique random value added to each password before hashing.

Without a salt, two users with password `hunter2` get the *same* hash — so an attacker cracks it once and owns both. They can even use a **rainbow table** (precomputed hashes) to reverse it instantly.

With a unique salt per user, identical passwords produce **completely different** hashes, and precomputed tables become useless. The salt isn't a secret — it's stored alongside the hash (bcrypt/argon2 embed it automatically).

## Doing it right

```js
// JavaScript (bcrypt) — salt is generated & stored inside the hash
import bcrypt from "bcrypt";
const hash = await bcrypt.hash(password, 12);       // on signup: store `hash`
const ok = await bcrypt.compare(password, hash);    // on login: compare
```

```python
# Python (passlib / argon2)
from passlib.hash import argon2
hash = argon2.hash(password)
ok = argon2.verify(password, hash)
```

```go
// Go (golang.org/x/crypto/bcrypt)
hash, _ := bcrypt.GenerateFromPassword([]byte(password), 12)
err := bcrypt.CompareHashAndPassword(hash, []byte(password)) // nil == match
```

```java
// Java (Spring Security)
PasswordEncoder enc = new BCryptPasswordEncoder(12);
String hash = enc.encode(password);
boolean ok = enc.matches(password, hash);
```

Notice: you **never write the hashing loop yourself**. Use the library.

## A few extras that matter

- **Compare in constant time** — libraries' `compare`/`verify` already do; never use `==` on raw hashes.
- **Don't cap password length** absurdly low, and allow spaces/symbols — long passphrases are strong.
- **Rate-limit login attempts** — slow hashing helps offline attacks; rate limiting stops online guessing.
- **Offer MFA** — the single biggest real-world win.
- On login failure, return a **generic message** ("invalid email or password") — don't reveal which part was wrong.

## Key takeaways

- Never store plaintext; never *encrypt* passwords — **hash** them.
- Use a **slow, salted, memory-hard** algorithm: **argon2** or **bcrypt**.
- A unique **salt** per user defeats rainbow tables and hides duplicate passwords.
- Use the library's `hash`/`verify`. Add rate limiting and MFA.

<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# 🌱 Part 0 · Foundations

**What a backend actually is, and what happens when you type a URL.**

<sub>`2 min read`</sub>

</div>

---

### In this part

- [0.1 What is a backend?](#01-what-is-a-backend)
- [0.2 What happens when you type a URL](#02-what-happens-when-you-type-a-url)
- [0.3 The client–server model](#03-the-clientserver-model)

---

## 0.1 What is a backend?

The **frontend** is what the user sees. The **backend** is everything they don't:

- It **stores** data that must outlive the browser tab (your account, your orders).
- It **decides** things the user isn't allowed to decide (are you allowed to see this? did your card actually clear?).
- It **shares** state between people (you post, I see it).

> **The rule that explains everything:** anything the user could tamper with must be decided on the server. The frontend is a *suggestion*. The backend is the *truth*.
>
> A user can open DevTools and change `isAdmin: false` to `true`. If your backend believes them, you don't have a bug — you have a breach.

## 0.2 What happens when you type a URL

This one question contains most of backend engineering. Follow it carefully:

```
1. DNS          "example.com" → 93.184.216.34
                Your computer asks a DNS resolver "what's the IP?"
                Cached at every layer, which is why it's usually instant.

2. TCP          Your machine opens a connection to that IP on port 443.
                A three-way handshake: SYN → SYN-ACK → ACK.

3. TLS          They exchange certificates and agree on encryption keys.
                This is the "S" in HTTPS. Now nobody in between can read it.

4. HTTP         Your browser sends:  GET / HTTP/1.1
                                     Host: example.com

5. Server       A load balancer picks one of N identical servers.
                That server runs your code.

6. Database     Your code asks the database for data. ← usually the slow part

7. Response     HTTP/1.1 200 OK  + the HTML/JSON body

8. Render       The browser paints it.
```

**Every part of this course is one of those steps in more depth.** Steps 4–7 are "the backend".

## 0.3 The client–server model

A **client** asks. A **server** answers. That's it.

The important consequence: **the server has no idea who you are between requests.** HTTP is *stateless*. Every request arrives as a stranger. That's why we invented cookies, sessions, and tokens — to re-answer "who is this?" on every single request. ([Part 5](05-security.md).)

---

<div align="center">

[**Contents**](../README.md#contents) · [🌐 Part 1 · HTTP →](01-http.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>

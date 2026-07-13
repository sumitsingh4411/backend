# OAuth 2.0 & OpenID Connect

"Log in with Google." "Let this app access your GitHub repos." Both are **OAuth 2.0** — the standard for granting an app limited access to your account somewhere else **without giving it your password**.

## The problem OAuth solves

You want a photo-printing app to access your Google Photos. The terrible old way: give it your Google password. Now it can read your email, delete your account — everything, forever.

**OAuth's answer:** the app never sees your password. Instead, Google asks *you* to approve **specific, limited access** ("view your photos"), then hands the app a **token** that only unlocks that.

> **Analogy:** A hotel valet key. It starts the car and opens the driver's door — but not the trunk or the glovebox. You never hand over your master key.

## The four roles

- **Resource Owner** — you, the user.
- **Client** — the app requesting access (the photo printer).
- **Authorization Server** — who authenticates you and issues tokens (Google).
- **Resource Server** — the API holding your data (Google Photos API).

## The Authorization Code flow (the one to know)

```
1. App redirects you to Google:  "this app wants: photos.read"
2. You log in to Google (the app never sees your password)
3. You click "Allow"
4. Google redirects back to the app with a short-lived  ?code=abc
5. App's backend swaps that code + its client_secret  →  access token
6. App calls the Photos API with:  Authorization: Bearer <access token>
```

Why the extra "code" step? The code goes through the **browser** (visible), but it's useless alone. Exchanging it for the real token happens **server-to-server** with a secret — so the token itself never touches the browser.

> For public clients (SPAs, mobile) that can't hold a secret, add **PKCE** — a proof the same app that started the flow is finishing it. Use Authorization Code + PKCE; the old "implicit flow" is deprecated.

## Scopes = limited access

A **scope** is a permission string: `photos.read`, `email`, `repo`. Tokens are issued *for specific scopes*. Always request the **minimum** you need — users trust apps that don't over-ask.

## OpenID Connect: OAuth for login

Here's the subtlety: **OAuth 2.0 is about authorization** (access to resources), *not* authentication. It answers "what may this app do?", not "who is this user?"

**OpenID Connect (OIDC)** is a thin layer *on top of* OAuth 2.0 that adds identity. It returns an extra **ID token** (a JWT) containing who the user is — `sub`, `email`, `name`.

- Need to **act on a user's data**? → OAuth 2.0 (access token).
- Need to **log a user in**? → OpenID Connect (ID token).

"Sign in with Google" is OIDC.

## Key takeaways

- **OAuth 2.0** = delegated **authorization**: limited access without sharing your password.
- Roles: owner, client, authorization server, resource server.
- Use the **Authorization Code flow (+ PKCE)**; tokens are exchanged server-side.
- **Scopes** limit what a token can do — request the minimum.
- **OIDC** adds authentication on top, returning an **ID token** that says who the user is.

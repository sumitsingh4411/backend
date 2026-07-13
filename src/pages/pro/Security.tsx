import type { ProSection } from "../../lib/proTopics";
import {
  Block,
  Callout,
  Ladder,
  Learn,
  MiniCard,
  Note,
  RedFlags,
  RefTable,
  Rules,
  Snippet,
  VS,
} from "../../components/ProKit";

/* ─────────────────────────── 01 · The mindset ─────────────────────────── */

function Mindset() {
  return (
    <>
      <Block title="Two questions, on every request">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniCard label="Authentication (AuthN)">
            <b>Who are you?</b> Proving identity — a password, a token, a
            passkey. Answered <i>once</i>, at the door.
          </MiniCard>
          <MiniCard label="Authorization (AuthZ)">
            <b>Are you allowed to do this?</b> Checked on <i>every</i> action,
            for <i>this specific</i> resource. This is where real breaches live.
          </MiniCard>
        </div>
        <Callout
          tone="bad"
          title="The #1 web vulnerability is an authorization bug"
        >
          <b>Broken access control</b> tops the OWASP list. It's almost always
          this: you check that the user is logged in, but not that{" "}
          <code>order.user_id === currentUser.id</code>. So user 42 changes the
          URL to <code>/orders/43</code> and reads someone else's invoice. It's
          called <b>IDOR</b>, and it is everywhere.
        </Callout>
      </Block>

      <Block title="The three rules everything else follows from">
        <Rules
          items={[
            <>
              <b>Never trust input.</b> Every byte from a client is hostile
              until validated — body, query, headers, cookies, filenames.
              Validate against an <b>allowlist</b> of what's permitted, not a
              blocklist of what's banned. You can't enumerate every bad input.
            </>,
            <>
              <b>Least privilege.</b> Every user, token, service and database
              account gets the <i>minimum</i> access it needs. When something is
              compromised — and one day something will be — this decides whether
              it's an incident or a catastrophe.
            </>,
            <>
              <b>Defense in depth.</b> No single control is trusted to hold.
              Validate at the edge <i>and</i> in the service <i>and</i> in the
              database. TLS <i>and</i> encryption at rest. Layers, because any
              one of them can fail.
            </>,
          ]}
        />
      </Block>

      <Block title="Authorization models">
        <RefTable
          head={["Model", "Decision based on", "Fits"]}
          rows={[
            [
              "RBAC",
              "the user's role (admin, editor)",
              "most apps — start here",
            ],
            [
              "ABAC",
              "attributes (owner? same org? business hours?)",
              "fine-grained rules",
            ],
            [
              "ReBAC",
              "the relationship graph (à la Google Zanzibar)",
              "sharing, nested teams",
            ],
          ]}
        />
        <Note>
          Wherever the logic lives, the <b>check</b> must sit as close to the
          data as you can put it — ideally the same query:{" "}
          <code>WHERE id = $1 AND org_id = $2</code>. A permission check three
          layers away from the query is a permission check someone will forget
          to call.
        </Note>
      </Block>

      <Learn
        links={[
          {
            label: "OWASP Top 10",
            href: "https://owasp.org/www-project-top-ten/",
            note: "The ten risks that cause real breaches. Read all ten once.",
          },
          {
            label: "OWASP Cheat Sheet Series",
            href: "https://cheatsheetseries.owasp.org/",
            note: "A practical, copy-pasteable checklist for every topic on this shelf.",
          },
          {
            label: "Google Zanzibar paper",
            href: "https://research.google/pubs/pub48190/",
            note: "How relationship-based authorization works at planet scale.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Checking authentication but not authorization",
          "Trusting a resource id from the URL without an ownership check",
          "Blocklist validation ('strip <script>') instead of allowlist",
          "One admin token that can do everything",
          "The authorization check living far from the query it guards",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 02 · Passwords ───────────────────────────── */

function Passwords() {
  return (
    <>
      <Block title="Hash, never encrypt">
        <Callout
          tone="bad"
          title="Encryption is reversible. That's exactly what you don't want."
        >
          If you can decrypt a password, so can an attacker who steals the key.
          You must never be <i>able</i> to recover a password — not for support,
          not for anything. Store a <b>one-way hash</b>. “Forgot password” sends
          a reset link; it never emails the password, because you don't have it.
        </Callout>
        <RefTable
          head={["Algorithm", "Verdict"]}
          rows={[
            ["Argon2id", "✅ best choice today (memory-hard)"],
            ["scrypt", "✅ good, memory-hard"],
            ["bcrypt", "✅ fine, battle-tested (72-byte input cap)"],
            ["PBKDF2", "⚠️ acceptable when a standard requires it"],
            ["SHA-256 / MD5", "❌ built for speed = built for cracking"],
          ]}
        />
        <Note>
          Why the slow ones? A password hash should be{" "}
          <b>deliberately expensive</b>. GPUs try billions of fast hashes per
          second; a memory-hard function tuned to ~100ms makes mass cracking
          economically hopeless. The salt is automatic in all of these — it
          stops one rainbow table from cracking every account at once.
        </Note>
      </Block>

      <Block title="The rules the NIST guidelines actually recommend">
        <Rules
          items={[
            <>
              <b>Require length, not gibberish.</b> Minimum 8 (ideally 12+),
              allow spaces, allow the whole Unicode range. A passphrase beats{" "}
              <code>P@ss1!</code> and people can remember it.
            </>,
            <>
              <b>Drop the composition rules.</b> Forcing “1 upper, 1 symbol”
              produces <code>Password1!</code> on every site. Modern guidance
              (NIST 800-63B) says stop.
            </>,
            <>
              <b>Check against breached-password lists</b> (Have I Been Pwned's
              range API). “Is this one of the 600 million already-leaked
              passwords?” blocks more real attacks than any complexity rule.
            </>,
            <>
              <b>No forced rotation.</b> Expiring passwords every 90 days just
              trains people to write them down and increment a number. Rotate on{" "}
              <i>evidence</i> of compromise, not a calendar.
            </>,
            <>
              <b>Rate-limit and lock out</b> login attempts, and make failures
              take the same time whether the user exists or not — otherwise the
              response time itself tells an attacker which emails are
              registered.
            </>,
          ]}
        />
      </Block>

      <Block title="MFA and the passwordless future">
        <Note>
          A second factor stops credential-stuffing dead — even a correct
          password isn't enough on its own. <b>TOTP</b> (authenticator app)
          beats <b>SMS</b>, which is vulnerable to SIM-swapping.{" "}
          <b>Passkeys / WebAuthn</b> are the real endgame: a device-bound key
          pair, nothing to phish, nothing to leak, no shared secret on your
          server at all. Offer them.
        </Note>
      </Block>

      <Learn
        links={[
          {
            label: "OWASP Password Storage Cheat Sheet",
            href: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
            note: "Exact algorithms and parameters, kept current.",
          },
          {
            label: "NIST 800-63B (digital identity guidelines)",
            href: "https://pages.nist.gov/800-63-3/sp800-63b.html",
            note: "The source for 'length over complexity' and no forced rotation.",
          },
          {
            label: "Have I Been Pwned — Pwned Passwords",
            href: "https://haveibeenpwned.com/Passwords",
            note: "A k-anonymity API to reject known-breached passwords without sending them.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Encrypting (reversibly) instead of hashing",
          "SHA-256 or MD5 for passwords",
          "Composition rules and 90-day forced rotation",
          "Login timing that reveals whether an email exists",
          "SMS as the only second factor",
        ]}
      />
    </>
  );
}

/* ─────────────────────── 03 · Sessions, JWT, OAuth ────────────────────── */

function SessionsTokens() {
  return (
    <>
      <Block title="Sessions vs JWT — the trade-off nobody tells you">
        <VS
          good={{
            title: "Server sessions",
            body: (
              <>
                A random id in a cookie; the real data lives in Redis.{" "}
                <b>Revoking is instant</b> — delete the row and they're logged
                out. The cost is a lookup per request (Redis makes it trivial).{" "}
                <b>The safe default.</b>
              </>
            ),
          }}
          bad={{
            title: "JWT (stateless)",
            body: (
              <>
                A signed token the server verifies without a lookup — great for
                scale and service-to-service. The catch:{" "}
                <b>you cannot un-issue one</b>. It's valid until it expires.
                “Logout” and “ban this user” become genuinely hard.
              </>
            ),
          }}
        />
        <Callout tone="warn" title="If you use JWT, use the two-token pattern">
          A <b>short-lived access token</b> (5–15 min) that's stateless and
          fast, plus a <b>long-lived refresh token</b> that <i>is</i> stored
          server-side and <i>can</i> be revoked. You keep most of the scale
          benefit and get revocation back. Keep a token blocklist for the
          access-token window if you need instant bans.
        </Callout>
        <Note>
          JWT footguns: <b>never</b> accept <code>alg: none</code>, never
          confuse the signing algorithms (the classic RS256→HS256 attack), keep
          the payload non-secret (it's only base64 — anyone can read it), and
          put a real expiry on it.
        </Note>
      </Block>

      <Block title="Cookie flags — the free security you keep forgetting">
        <RefTable
          head={["Flag", "Does"]}
          rows={[
            [
              "HttpOnly",
              "JavaScript can't read it → an XSS bug can't steal the session",
            ],
            ["Secure", "sent only over HTTPS → never leaks in plaintext"],
            [
              "SameSite=Lax",
              "not sent on cross-site requests → blocks most CSRF",
            ],
            ["SameSite=Strict", "even tighter; can break legit inbound links"],
            [
              "__Host- prefix",
              "binds the cookie to the exact host + a secure path",
            ],
          ]}
        />
        <Note>
          <b>Put auth in an HttpOnly cookie, not localStorage.</b> Anything in
          localStorage is readable by any script on the page — one XSS or one
          bad npm dependency and the token walks out the door. An HttpOnly
          cookie can't be read by JavaScript at all.
        </Note>
      </Block>

      <Block title="OAuth 2.0 & OIDC — 'Sign in with Google', decoded">
        <Callout
          tone="info"
          title="OAuth is authorization; OIDC adds identity on top"
        >
          OAuth answers “can this app access X on the user's behalf?”{" "}
          <b>OIDC</b> adds an <b>ID token</b> that answers “who is this user?”.
          “Sign in with Google” is OIDC. Don't hand-roll it — one wrong redirect
          check is an account takeover.
        </Callout>
        <Ladder
          ordered
          steps={[
            [
              "App redirects to Google",
              "with client_id, scopes, redirect_uri, state, PKCE challenge",
            ],
            [
              "User approves at Google",
              "credentials are entered THERE — your app never sees the password",
            ],
            [
              "Google redirects back with a code",
              "a short-lived, single-use authorization code",
            ],
            [
              "Your server exchanges the code",
              "server-to-server, using the client secret + PKCE verifier",
            ],
            [
              "Google returns tokens",
              "access token + an OIDC id token → you create a session",
            ],
          ]}
        />
        <Rules
          items={[
            <>
              <b>Use Authorization Code + PKCE</b> everywhere now — SPAs and
              mobile included. The old implicit flow is dead.
            </>,
            <>
              <b>
                The <code>state</code> parameter is mandatory
              </b>{" "}
              — it's your CSRF protection for the callback. Generate it, store
              it, verify it comes back unchanged.
            </>,
            <>
              <b>
                Exact-match the <code>redirect_uri</code>
              </b>{" "}
              against a registered allowlist. Loose matching here is the classic
              OAuth takeover.
            </>,
          ]}
        />
      </Block>

      <Learn
        links={[
          {
            label: "OAuth 2.0 Simplified (Aaron Parecki)",
            href: "https://www.oauth.com/",
            note: "The clearest OAuth walkthrough, free online.",
          },
          {
            label: "OWASP JWT Cheat Sheet",
            href: "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html",
            note: "The alg-confusion and revocation footguns, spelled out.",
          },
          {
            label: "WebAuthn Guide",
            href: "https://webauthn.guide/",
            note: "Passkeys explained — the thing that replaces all of the above.",
          },
        ]}
      />

      <RedFlags
        items={[
          "JWT with no revocation story for logout / ban",
          "Auth token in localStorage instead of an HttpOnly cookie",
          "Accepting alg: none or a client-chosen signing algorithm",
          "OAuth without state (CSRF) or with loose redirect_uri matching",
          "Session cookies missing HttpOnly / Secure / SameSite",
        ]}
      />
    </>
  );
}

/* ─────────────────────────── 04 · The OWASP risks ─────────────────────── */

function CommonAttacks() {
  return (
    <>
      <Block title="Injection — untrusted data becomes code">
        <VS
          good={{
            title: "Parameterised — data stays data",
            body: (
              <Snippet
                lang="javascript"
                code={`db.query(
  "SELECT * FROM users WHERE email = $1",
  [email]      // the driver keeps this OUT of the SQL grammar
);`}
              />
            ),
          }}
          bad={{
            title: "String-built — data becomes SQL",
            body: (
              <Snippet
                lang="javascript"
                code={`db.query(
  "SELECT * FROM users WHERE email = '"
   + email + "'"
);
// email = "' OR '1'='1' --"
// → returns every user. or DROPs the table.`}
              />
            ),
          }}
        />
        <Note>
          <b>Parameterised queries fix injection completely</b> — not "mostly",
          completely — because the value can never cross into the query grammar.
          The same idea covers everywhere untrusted data meets an interpreter:
          shell commands, <code>eval</code>, LDAP, NoSQL, XPath. Never build any
          of them by concatenation.
        </Note>
      </Block>

      <Block title="XSS — untrusted data becomes script in the browser">
        <Rules
          items={[
            <>
              <b>Escape on output, by context.</b> The same string is escaped
              differently in HTML, in an attribute, in JavaScript, in a URL.
              Modern frameworks (React, Vue, Svelte) do the HTML-context
              escaping for you — until you reach for{" "}
              <code>dangerouslySetInnerHTML</code>/<code>v-html</code>.
            </>,
            <>
              <b>Sanitize any HTML you must render</b> (a rich-text field) with
              a vetted library like <b>DOMPurify</b>. Never trust a blocklist
              you wrote yourself.
            </>,
            <>
              <b>A Content-Security-Policy is your safety net.</b> Even if an
              XSS slips through, a strict CSP (no inline scripts, allowlisted
              sources) stops the injected script from running or phoning home.
            </>,
          ]}
        />
      </Block>

      <Block title="CSRF, SSRF, and the rest of the roll-call">
        <RefTable
          head={["Attack", "In one line", "Defence"]}
          rows={[
            [
              "CSRF",
              "another site makes the browser POST as the logged-in user",
              "SameSite cookies + a CSRF token",
            ],
            [
              "SSRF",
              "you fetch a user-supplied URL → they point it at internal metadata",
              "allowlist hosts; block internal IP ranges",
            ],
            [
              "XXE",
              "an XML parser resolves external entities → reads local files",
              "disable external entities in the parser",
            ],
            [
              "Path traversal",
              "filename '../../etc/passwd' escapes your directory",
              "resolve the path, confirm it's still inside the root",
            ],
            [
              "Open redirect",
              "?next=//evil.com sends users off-site after login",
              "allowlist redirect targets",
            ],
            [
              "Mass assignment",
              "client sends {is_admin:true} and your ORM saves it",
              "explicitly pick allowed fields",
            ],
          ]}
        />
        <Callout tone="warn" title="SSRF is the cloud-era killer">
          The Capital One breach was SSRF: a request tricked the server into
          fetching <code>169.254.169.254</code> — the cloud metadata endpoint —
          and handing back its IAM credentials. If your service fetches
          user-supplied URLs, <b>block the link-local and private ranges</b> and
          use IMDSv2.
        </Callout>
      </Block>

      <Learn
        links={[
          {
            label: "PortSwigger Web Security Academy",
            href: "https://portswigger.net/web-security",
            note: "Free hands-on labs where you actually exploit each bug. The best way to learn.",
          },
          {
            label: "OWASP Cheat Sheets: Injection, XSS, CSRF, SSRF",
            href: "https://cheatsheetseries.owasp.org/",
            note: "One page per attack, each with concrete defences.",
          },
          {
            label: "Content Security Policy (MDN)",
            href: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            note: "Your last line of defence against XSS.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Any query, command, or template built by string concatenation",
          "dangerouslySetInnerHTML on unsanitised input",
          "Fetching user-supplied URLs with no allowlist (SSRF)",
          "ORM.update(req.body) — mass assignment",
          "A redirect target taken straight from a query parameter",
        ]}
      />
    </>
  );
}

/* ─────────────────────── 05 · Transport & secrets ─────────────────────── */

function TransportSecrets() {
  return (
    <>
      <Block title="TLS everywhere — it's free now">
        <Rules
          items={[
            <>
              <b>HTTPS on everything</b>, including internal service-to-service
              calls. Certificates are free (Let's Encrypt) and automatic. There
              is no excuse left.
            </>,
            <>
              <b>HSTS</b> (<code>Strict-Transport-Security</code>) tells
              browsers “only ever reach me over HTTPS”, closing the first-visit
              downgrade window. Add it once.
            </>,
            <>
              <b>Terminate TLS at the edge</b> (load balancer / CDN), and
              consider <b>mTLS</b> — both sides present certificates — for
              internal traffic in a zero-trust network.
            </>,
            <>
              <b>Encrypt at rest too.</b> TLS protects data in flight; disk
              encryption and column/field encryption protect it when a disk or a
              backup is stolen. Defense in depth.
            </>,
          ]}
        />
      </Block>

      <Block title="🚨 Secrets — and the trap everyone falls into once">
        <Callout
          tone="bad"
          title="Deleting a secret in the next commit does nothing"
        >
          You commit an API key, notice, and remove it in the next commit.{" "}
          <b>It is still in the git history</b>, on every clone, on every fork,
          in GitHub's cache — forever. Bots scrape public commits for keys
          within <i>seconds</i>. The only fix is to{" "}
          <b>rotate the key immediately</b>. The commit is a lost cause; the
          live credential is what matters.
        </Callout>
        <Rules
          items={[
            <>
              <b>Secrets come from the environment</b> or a secret manager
              (Vault, AWS Secrets Manager, Doppler) — never from source, never
              from a committed <code>.env</code>. Put <code>.env</code> in{" "}
              <code>.gitignore</code> on line one of a new project.
            </>,
            <>
              <b>Scan for secrets in CI</b> (gitleaks, trufflehog) and add a
              pre-commit hook, so a key is caught before it's ever pushed.
            </>,
            <>
              <b>Rotate on a schedule and on suspicion</b>, and make rotation
              painless — a secret you're afraid to rotate is one you'll leave in
              place after a breach.
            </>,
            <>
              <b>Never log secrets, tokens, or PII.</b> A token in a log is a
              leaked token, and logs get shipped to five third-party services.
              Redact at the logger.
            </>,
          ]}
        />
      </Block>

      <Block title="Security headers — set these and move on">
        <RefTable
          head={["Header", "Buys you"]}
          rows={[
            ["Strict-Transport-Security", "HTTPS-only, forever"],
            ["Content-Security-Policy", "the XSS safety net"],
            [
              "X-Content-Type-Options: nosniff",
              "stops MIME-type guessing attacks",
            ],
            [
              "X-Frame-Options / frame-ancestors",
              "no clickjacking in an iframe",
            ],
            ["Referrer-Policy", "don't leak full URLs to third parties"],
          ]}
        />
        <Note>
          Don't hand-roll these — use <b>helmet</b> (Node),{" "}
          <b>SecurityMiddleware</b> (Django), or your framework's equivalent,
          and verify with <b>securityheaders.com</b>.
        </Note>
      </Block>

      <Block title="Dependencies are your biggest attack surface">
        <Note>
          Most of your running code is code you didn't write. Run{" "}
          <code>npm audit</code> / <code>pip-audit</code> and <b>Dependabot</b>{" "}
          in CI, pin versions with a lockfile, and prefer fewer, well-maintained
          dependencies. A typo-squatted or hijacked package runs with all your
          privileges — supply-chain attacks are now the fastest-growing category
          of breach.
        </Note>
      </Block>

      <Learn
        links={[
          {
            label: "Let's Encrypt",
            href: "https://letsencrypt.org/getting-started/",
            note: "Free, automated TLS. No reason to run plaintext anywhere.",
          },
          {
            label: "OWASP Secrets Management Cheat Sheet",
            href: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html",
            note: "Storage, rotation, and detection done right.",
          },
          {
            label: "securityheaders.com",
            href: "https://securityheaders.com/",
            note: "Scan your site, get a grade, fix the headers it flags.",
          },
        ]}
      />

      <RedFlags
        items={[
          "Any plaintext HTTP, including internal calls",
          "Secrets in source or a committed .env",
          "Assuming a removed-in-next-commit secret is safe (rotate it)",
          "Tokens or PII in application logs",
          "Never running a dependency audit",
        ]}
      />
    </>
  );
}

export const securitySections: ProSection[] = [
  {
    id: "mindset",
    title: "The security mindset",
    icon: "🧠",
    kicker:
      "AuthN vs AuthZ, least privilege, defense in depth, and why the #1 bug is an authorization check you forgot.",
    minutes: 6,
    Content: Mindset,
  },
  {
    id: "passwords",
    title: "Passwords & MFA",
    icon: "🔑",
    kicker:
      "Hash don't encrypt, which algorithm, the modern rules, breached-password checks, and passkeys.",
    minutes: 6,
    Content: Passwords,
  },
  {
    id: "sessions",
    title: "Sessions, JWT & OAuth",
    icon: "🎫",
    kicker:
      "The revocation trade-off, cookie flags, and 'Sign in with Google' decoded step by step.",
    minutes: 8,
    Content: SessionsTokens,
  },
  {
    id: "attacks",
    title: "Injection, XSS & the OWASP risks",
    icon: "💉",
    kicker:
      "The attacks that cause real breaches, each with the one defence that actually closes it.",
    minutes: 8,
    Content: CommonAttacks,
  },
  {
    id: "transport",
    title: "TLS, secrets & headers",
    icon: "🔏",
    kicker:
      "HTTPS everywhere, the secret-in-git-history trap, security headers, and your dependency attack surface.",
    minutes: 6,
    Content: TransportSecrets,
  },
];

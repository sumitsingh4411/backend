# CI/CD Pipelines

**CI/CD** automates the path from *"I pushed code"* to *"it's running in production"* — safely, repeatably, and without a human running commands from memory at midnight.

## The two halves

**CI — Continuous Integration**
Every push automatically **builds and tests** your code. Problems surface within minutes, on the commit that caused them, instead of accumulating into a giant broken mess.

**CD — Continuous Delivery/Deployment**
Every change that passes CI is automatically **released**.
- *Delivery* — it's ready to deploy; a human clicks the button.
- *Deployment* — it goes to production automatically, no button.

## A real pipeline

```
push / PR
   │
   ├─ 1. Lint & typecheck        (seconds)
   ├─ 2. Unit tests              (fast — run these first)
   ├─ 3. Build                   (compile, build the Docker image)
   ├─ 4. Integration tests       (against a real DB in a container)
   ├─ 5. Security scan           (npm audit, image scan)
   │
   ├─ 6. Deploy → staging        (automatic)
   ├─ 7. Smoke tests             (is it actually alive?)
   └─ 8. Deploy → production     (auto, or with approval)
```

**Order matters:** put the fastest, most likely-to-fail checks first so you fail in 20 seconds, not 20 minutes.

## GitHub Actions example

```yaml
name: CI/CD
on:
  push: { branches: [main] }
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:                     # a real DB for integration tests
        image: postgres:16
        env: { POSTGRES_PASSWORD: test }
        ports: ["5432:5432"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

  deploy:
    needs: test                     # only if tests passed
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}   # from the secret store
```

## Deployment strategies

- **Rolling** — replace instances a few at a time. Zero downtime, gradual. *(The common default.)*
- **Blue-green** — run two full environments; flip the load balancer from blue → green. **Instant rollback** (flip back). Costs double during the switch.
- **Canary** — send 5% of traffic to the new version, watch the metrics, then ramp to 100%. **Safest** — you catch bugs with 5% of users, not all of them.
- **Recreate** — stop the old, start the new. Simple, but causes downtime.

## Rules that keep you safe

- **The pipeline is the only way to production.** No manual `scp` to a server. Ever.
- **Build once, promote the same artifact** through staging → prod. Rebuilding for each environment means you didn't test what you shipped.
- **Secrets live in the CI secret store**, never in the YAML.
- **Make rollback trivial and practiced.** The best incident response is "roll back, then investigate."
- **Keep it fast.** A 45-minute pipeline gets bypassed by frustrated humans. Under 10 minutes.
- **Run migrations as an explicit, backward-compatible step** — never let two versions of your app fight over an incompatible schema.

## Key takeaways

- **CI** = auto build + test every push. **CD** = auto release what passes.
- Order stages **fast-to-slow**; fail early.
- **Rolling / blue-green / canary** trade cost against safety — canary is the safest.
- Build once and promote; keep secrets in the store; **make rollback easy** and the pipeline the only path to prod.

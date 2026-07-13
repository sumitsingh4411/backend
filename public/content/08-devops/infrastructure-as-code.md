# Infrastructure as Code

Your app is in git, reviewed, tested, and versioned. Your **infrastructure** — the servers, databases, load balancers, DNS, firewall rules — was created by someone clicking around a web console at 2am eight months ago.

Nobody knows exactly what's there. Nobody can rebuild it. **That's the problem IaC solves.**

## The pain of "ClickOps"

Creating infrastructure by hand in a cloud console means:

- ❌ **Not reproducible** — can you build an identical staging environment? Not really.
- ❌ **Not reviewable** — nobody code-reviewed that firewall rule opening port 22 to the world.
- ❌ **Not versioned** — who changed this, when, and why? No history, no blame.
- ❌ **Not recoverable** — a region goes down. Rebuild everything… from memory?
- ❌ **Drift** — staging and production quietly diverge until "works in staging" means nothing.

## The idea

**Describe your infrastructure in files. Commit them to git. Let a tool make reality match.**

```hcl
# main.tf — this IS your infrastructure
resource "aws_db_instance" "main" {
  identifier        = "app-prod-db"
  engine            = "postgres"
  engine_version    = "16.2"
  instance_class    = "db.t4g.medium"
  allocated_storage = 100

  backup_retention_period = 30       # reviewable!
  multi_az                = true     # reviewable!
  storage_encrypted       = true     # reviewable!
}
```

Now that database is **code**: diffable, reviewable in a PR, versioned in git, and reproducible in any environment.

## Declarative, not imperative

This is the key mental shift — and it's the same idea as Kubernetes.

- **Imperative** (a bash script): *"create a server, then attach a disk, then open a port…"* You must know the current state and script every transition. Run it twice and you get two servers.
- **Declarative** (Terraform): *"I want one server with this disk and this port."* The tool **compares desired state to reality** and works out the difference itself.

That comparison step is what makes it safe. Run it a hundred times: if reality already matches, **it does nothing**. That property is called **idempotency** — the same idea you met with APIs and jobs.

## The workflow

```bash
terraform plan     # 👀 show me exactly what would change — CHANGES NOTHING
terraform apply    # ✅ make it so
```

```text
Terraform will perform the following actions:

  ~ aws_db_instance.main
      ~ instance_class = "db.t4g.medium" -> "db.t4g.large"

  - aws_security_group.old_sg will be DESTROYED     ← 🚨 wait, WHAT?

Plan: 0 to add, 1 to change, 1 to destroy.
```

> **`plan` is the whole point.** It's a diff of the real world. Read it *every single time* — this is where you catch "…it's going to delete the production database" **before** it happens.

Put `plan` in your CI on every PR, so reviewers see the infrastructure diff alongside the code diff.

## State — and the one rule you must not break

Terraform keeps a **state file** mapping your code to real cloud resources ("`aws_db_instance.main` = `db-abc123`"). Without it, it couldn't tell an update from a create.

🚨 **Never keep state on your laptop.** If two engineers apply at once with separate local state, they'll fight and corrupt your infrastructure.

**Use a remote backend with locking:**

```hcl
terraform {
  backend "s3" {
    bucket         = "mycompany-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "eu-west-2"
    dynamodb_table = "tf-locks"      # 🔒 only one apply at a time
    encrypt        = true
  }
}
```

⚠️ **The state file contains secrets** (generated DB passwords, keys) in plaintext. Encrypt it, lock down access, and **never commit it to git**.

## Configuration drift

Someone SSHs in and changes a setting by hand, or clicks something in the console. Now reality ≠ code. That's **drift** — and it means your code is lying.

Next `terraform apply` will helpfully **revert their change** (possibly at the worst moment).

**The fix is cultural, not technical:** *if it isn't in code, it doesn't exist.* Nobody hand-edits production. Detect drift by running `terraform plan` on a schedule and alerting if it's ever non-empty.

## Modules: don't repeat yourself

```hcl
module "prod" {
  source        = "./modules/environment"
  environment   = "production"
  instance_size = "db.t4g.large"
  replicas      = 3
}

module "staging" {
  source        = "./modules/environment"   # identical shape…
  environment   = "staging"
  instance_size = "db.t4g.micro"            # …smaller and cheaper
  replicas      = 1
}
```

**Staging is now genuinely a smaller copy of production**, guaranteed — not a rough approximation that drifted years ago. This single property removes an entire class of "but it worked in staging" bugs.

## The tools

| Tool | What it is |
|---|---|
| **Terraform / OpenTofu** | The standard. Declarative HCL, works across every cloud. **Start here.** |
| **Pulumi** | Same idea, but you write it in TypeScript/Python/Go — real loops and types. |
| **AWS CloudFormation / CDK** | AWS-native. |
| **Ansible** | Configuration management (what's *inside* a server) — complements, doesn't replace. |
| **Crossplane** | Manage cloud infra via Kubernetes CRDs. |

> **Terraform provisions the machine; Ansible/Docker configure what runs on it.** Different jobs.

## Rules that keep you safe

- ✅ **Everything in git. No exceptions.** Infra changes go through PR review like any other code.
- ✅ **Always read the `plan`.** Especially any line that says `destroy`.
- ✅ **Remote, encrypted, locked state.**
- ✅ **Separate state per environment** — a mistake in staging must be incapable of touching prod.
- ✅ **Never hardcode secrets** — reference a secrets manager.
- ✅ **`prevent_destroy` on anything precious:**
  ```hcl
  lifecycle { prevent_destroy = true }   # on your production database
  ```
- ✅ **Pin provider/module versions** — reproducibility is the entire point.
- ✅ **Scan for misconfigurations** (`tfsec`, `checkov`) in CI — catch the public S3 bucket *before* it exists.

## Key takeaways

- **ClickOps** infrastructure isn't reproducible, reviewable, versioned, or recoverable — and it **drifts**.
- IaC makes infra **code in git**: diffable, PR-reviewed, and rebuildable from scratch.
- It's **declarative** — you state the desired end state and the tool computes the diff (**`plan`** ⇒ **`apply`**). It's idempotent.
- **Always read the `plan`** — it's your last line of defence against "destroy production database."
- Store **state remotely, encrypted, and locked**; it holds secrets and must never be on a laptop or in git.
- Use **modules** so staging is a genuine (smaller) copy of production, and scan for misconfigurations in CI.

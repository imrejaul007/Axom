# Axom Git Audit Report

**Date:** 2026-06-19
**Auditor:** RTMN Internal Audit
**Axom git remote (source of truth):** `git@github.com:imrejaul007/Axom.git`
**Scope:** Determine which Axom services are committed to git, and to which git.

---

## TL;DR

**Every Axom service under `companies/Axom/` IS committed to git** — just not the way I initially thought.

| Result | Count | Notes |
|--------|------:|-------|
| ✅ Committed to Axom remote | **18 / 18** | All 18 service directories exist on `github.com/imrejaul007/Axom` |
| 🟡 Plus an extra nested repo | **1** | `rendez/` is also its own standalone repo at `github.com/imrejaul007/Rendez` |
| ❌ NOT in parent RTMN repo | **18 / 18** | The parent RTMN repo ignores the entire `companies/Axom/` tree (verified by `git ls-files`) |

### The git situation

```
github.com/imrejaul007/Axom        ← ONE big repo containing all 18 services
       ├── Cosmic-OS/
       ├── REZ-cosmic-twin/
       ├── REZ-emotional-intelligence/
       ├── REZ-human-context-graph/
       ├── REZ-life-pattern-engine/
       ├── REZ-life-story-engine/
       ├── REZ-memory-engine/
       ├── agent-governance-service/
       ├── audit-trail-service/
       ├── breach-detection-service/
       ├── buzzlocal/
       ├── buzzlocal-app/
       ├── buzzlocal-services/
       ├── communication-compliance-service/
       ├── enforcement-gateway/
       ├── llm-compliance-service/
       ├── policy-engine-service/
       ├── rendez/                  ← ALSO exists standalone at github.com/imrejaul007/Rendez
       ├── REZ-trust-os/            (only on remote, not on local disk)
       ├── compliance-sdk/          (only on remote, not on local disk)
       ├── regulatory-rules/        (only on remote, not on local disk)
       ├── scam-call-detection/     (only on remote, not on local disk)
       ├── trust-os-gateway/        (only on remote, not on local disk)
       ├── trust-os-shield-app/     (only on remote, not on local disk)
       └── trust-os-shield-sdk/     (only on remote, not on local disk)
```

---

## Detailed Findings

### ✅ All 18 services are on `github.com/imrejaul007/Axom`

I cloned `git@github.com:imrejaul007/Axom.git` and compared its top-level directories against your local `companies/Axom/` directory. **All 18 service directories that exist on your local disk also exist on the remote, with tracked files.**

| Service | Tracked on Axom remote |
|---------|----------------------:|
| Cosmic-OS | ✅ 34 files |
| REZ-cosmic-twin | ✅ 6,567 files |
| REZ-emotional-intelligence | ✅ 19 files |
| REZ-human-context-graph | ✅ 4,230 files |
| REZ-life-pattern-engine | ✅ 6,563 files |
| REZ-life-story-engine | ✅ 6,591 files |
| REZ-memory-engine | ✅ 6,587 files |
| agent-governance-service | ✅ 7,056 files |
| audit-trail-service | ✅ 7,054 files |
| breach-detection-service | ✅ 8,117 files |
| buzzlocal | ✅ 184 files |
| buzzlocal-app | ✅ 147 files |
| buzzlocal-services | ✅ 388 files |
| communication-compliance-service | ✅ 8,001 files |
| enforcement-gateway | ✅ 7,058 files |
| llm-compliance-service | ✅ 8,625 files |
| policy-engine-service | ✅ 7,056 files |
| rendez | ✅ 364 files |

**Remote totals:** 84,785 tracked files across the whole Axom repo.

### ✅ Axom remote is current

- **Default branch:** `main`
- **HEAD commit:** `86c847b docs: Add complete RTNM audit files and CLAUDE.md`
- **Remote branches:** `main`, plus `docs/trust-os-deep-audit`, `feat/breach-detection-service`, `feature/compliance-services`

The Axom remote is healthy and being actively updated.

### 🟡 `rendez/` is duplicated — it exists in BOTH repos

`companies/Axom/rendez/` is a special case. It is **both**:
1. A subdirectory inside the Axom monorepo (`Axom/rendez/` → tracked as part of Axom).
2. A standalone git repo on its own (`Axom/rendez/.git` → remote `github.com/imrejaul007/Rendez`).

This is **risky** — the two copies can drift apart. If you make a change in `rendez/` thinking it'll push to the `Rendez` repo, but you've also modified the same files via the parent Axom repo, you'll get conflicts. See "Risks" below.

### 🟡 7 services exist ONLY on the remote, not on your local disk

These are present in the Axom remote but missing from `companies/Axom/` on your machine:

| Missing service | What it likely is |
|-----------------|-------------------|
| `REZ-trust-os/` | Trust OS core service |
| `compliance-sdk/` | SDK for compliance integration |
| `regulatory-rules/` | Regulatory rules engine |
| `scam-call-detection/` | Scam call detection service |
| `trust-os-gateway/` | Trust OS API gateway |
| `trust-os-shield-app/` | Trust OS mobile/web app |
| `trust-os-shield-sdk/` | Trust OS SDK |

**This means you have local-only code AND remote-only code.** Anything you change locally in `REZ-trust-os` etc. on the remote will be invisible to anyone using only the local disk copy, and vice versa.

### 🟡 The Axom remote has documentation files not on your local disk

The remote has these top-level files that are missing locally:

- `CLAUDE.md` (the Axom project's own CLAUDE.md — the one in your repo is the RTMN-level one)
- `README.md`
- `Dockerfile`, `docker-compose.yml`, `docker-compose.compliance.yml`, `package.json`
- `AUDIT-FULL-AXOM.md`, `AUDIT-REPORT-JUNE-2026.md`, `AXOM-DETAILED-AUDIT.md`
- `COMPANIES-AUDIT.md`, `COMPLETE-PRODUCTION-READY.md`, `DEPLOY-READY.md`
- `FEATURES.md`, `PRODUCTION-READINESS-ACTION-PLAN.md`, `PRODUCTION-READY-AUDIT.md`
- `PRODUCTS-FEATURES-AUDIT.md`, `RTNM-COMPANIES-AUDIT.md`, `RTNM-PRODUCTS-FEATURES-AUDIT.md`
- `SUTAR-OS-COMPONENTS.md`, `SUTAR-OS-FEATURES.md`, `TRUST-OS-ACTUAL-STATE.md`
- `TRUST-OS-AUDIT-ZERODRIFT.md`, `TRUST-OS-BUILDER.md`, `TRUST-OS-COMPREHENSIVE-AUDIT.md`

Your local copy of `companies/Axom/` is **missing all of these**. Likely you synced the services but skipped the documentation and config, OR your local is from a different branch / older commit.

### ❌ None of this is in the parent RTMN repo

```
$ git ls-files companies/Axom | wc -l
0
```

The parent RTMN repo ignores `companies/Axom/` entirely. This is intentional-looking (a single company repo with its own remote) — but it means **the RTMN Hub has no awareness of Axom**, and there's no top-level audit or inventory covering it from the RTMN side.

---

## Risks

### 🟡 Medium — `rendez/` is in two repos at once
`rendez/` is both a subdirectory of the Axom monorepo and a standalone repo with its own remote. They will diverge. Whoever last edited a file last "wins" depending on which `git push` ran.

### 🟡 Medium — Local disk is out of sync with the remote
7 services + 30+ documentation/config files on the remote don't exist locally. If you're working from `companies/Axom/`, you don't see the full picture. Run `cd companies/Axom && git pull` (or set this directory up as a checkout of the Axom remote) to get the missing pieces.

### 🟢 Low — Ownership is on a personal GitHub account
`imrejaul007` is a personal account, not an organization. If Axom is supposed to be a company asset, the repo should be moved to an org (e.g. `hojai-ai/Axom`). Same applies to the `Rendez` repo.

### 🟢 Low — Nothing is committed to the parent RTMN repo
Not necessarily a bug — Axom having its own repo is a fine design. But it means the parent RTMN's `STATUS-AND-REMAINING-WORK.md` and CLAUDE.md inventory have no visibility into Axom's state.

---

## Recommendations

1. **Sync the local copy with the Axom remote.** Replace `companies/Axom/` with a fresh clone of `github.com/imrejaul007/Axom` (or `git pull` if you set it up as a checkout). This will recover the 7 missing services and 30+ missing docs.

2. **Resolve the `rendez/` duplication.** Pick one model:
   - **Keep `rendez/` only as a standalone repo** and remove it from the Axom monorepo, OR
   - **Keep `rendez/` only inside the Axom monorepo** and remove its `.git` directory + standalone remote.
   - Don't keep both — they will diverge.

3. **Move to org-owned remotes.** Migrate `imrejaul007/Axom` and `imrejaul007/Rendez` to a company-owned org (`hojai-ai/Axom`, `hojai-ai/Rendez`) for proper ownership/governance.

4. **Add Axom to RTMN's STATUS document.** Once you decide the relationship between RTMN and Axom (independent company? subsidiary? product line?), update `STATUS-AND-REMAINING-WORK.md` and the parent `CLAUDE.md` so RTMN's overall inventory reflects reality.

5. **Add CI to the Axom repo.** Compliance-named services (audit-trail, breach-detection, policy-engine, llm-compliance, enforcement-gateway, communication-compliance, agent-governance) should run tests + security scans on every push.

---

## How to verify this report yourself

```bash
# Show what the Axom remote contains
git ls-remote git@github.com:imrejaul007/Axom.git
git clone --depth 1 git@github.com:imrejaul007/Axom.git /tmp/axom-check
ls /tmp/axom-check

# Show that the parent RTMN repo has none of it
git ls-files companies/Axom | wc -l        # → 0

# See which services are tracked in Axom remote
git -C /tmp/axom-check ls-files | awk -F/ '{print $1}' | sort -u
```

---

*Report generated 2026-06-19 by RTMN internal audit.*
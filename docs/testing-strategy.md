# Testing strategy

Goal: automate roughly 80–90% of verification so a new Domus operation does
not require a person to click through n8n for every field.

`n8n-nodes-domus` is a **declarative** community node. n8n's in-monorepo
helpers (`NodeTestHarness`, Jest + `nock` inside `packages/nodes-base`) are
not a public API for community packages. This repo therefore keeps
**Node.js `node:test`** for code tests and adds **Playwright** for UI. Jest
and Vitest are not introduced.

## Layers

```text
Capa 1  Unit / routing          npm test / npm run test:unit
Capa 2  Domus contract          npm run test:integration
Capa 3  n8n workflow REST       npm run test:workflow
Capa 4  Docker package load     npm run test:docker
Capa 5  Playwright UX           npm run test:e2e
```

| Layer | Needs token | Needs Docker n8n | Runs on PR | Destructive |
| ----- | ----------- | ---------------- | ---------- | ----------- |
| 1 Unit | no | no | yes | no |
| 2 Integration | `DOMUS_TEST_TOKEN` | no | no | no. Writes need manual `test:integration:write` |
| 3 Workflow | token + running n8n | yes | no | no |
| 4 Docker | no | yes | no (manual / nightly) | no |
| 5 Playwright | token only for live execute | yes | no (manual / nightly) | no |

## Capa 1 — Unit / routing

Location: `test/*.test.js`.

For every public operation, assert from the compiled node description:

- HTTP method and path
- query, header, and body routing
- `postReceive` / item splitting
- required parameters and display options
- credential auth (`Authorization` without `Bearer`)
- `listSearch` helpers (mocked `httpRequestWithAuthentication`)

This is the right unit shape for a declarative node: there is no `execute()`
to call. Do not add real HTTP here.

When adding an operation, extend the existing pattern in `test/domus-node.test.js`
or add a focused `test/<resource>-<operation>.test.js`.

n8n's published guidance for programmatic nodes (Jest, `nock`, mock
`IExecuteFunctions`) applies if a future operation must become programmatic.
Until then, stay on `node:test`.

## Capa 2 — Domus contract / integration

Location: `test/integration/`.

```bash
# Optional local file (never commit it). Values do not override a real env var.
# cp .env.example .env
DOMUS_TEST_TOKEN=... npm run test:integration
```

Rules:

- Read tests default to `https://newapi.domus.la` and refuse production.
- Write tests fail immediately unless the host is exactly
  `https://newapi.domus.la`, even if `DOMUS_TEST_BASE_URL` is wrong.
- Skip cleanly when `DOMUS_TEST_TOKEN` is missing.
- Never print, log, or assert the token. Redact it in error text.
- Do not commit tokens, cassettes with auth headers, or live fixtures.

Default suite is **read-only**:

1. `GET /general/countries` — same call as the credential test
2. `GET /search/cities` — helper contract
3. `GET /properties` with `Perpage: 1` — search envelope (`data`, `current_page`)
4. `GET /properties/{codpro}` using a code discovered in step 3 — get envelope
5. `GET /general/status` and `GET /administrative/sources` — Change Status locators
6. `GET /properties/status/{codpro}` — nested history envelope

Assertions are structural (`Array.isArray(data)`, `codpro` present), never
"property 12345 must exist".

### Write strategy

Domus documents that created properties **cannot be deleted**. The testing
environment is wiped on the first day of each month, but creating a property
on every CI run is still the wrong default.

Write tests live in `test/integration/domus-api.write.test.js` and run only
via a **manual** command or `workflow_dispatch` with `write_tests=true`.
The scheduled nightly job never sets `DOMUS_TEST_WRITE` and never calls the
write script.

```text
DOMUS_TEST_TOKEN=... DOMUS_TEST_WRITE=1 npm run test:integration:write
```

Any POST/PUT/PATCH/DELETE through the helper also refuses a host that is not
exactly `https://newapi.domus.la`.

Intended loop (testing host only):

```text
POST /properties          unique n8n-e2e-* reference
GET  /properties/{codpro}
PUT  /properties/{codpro} change a safe field (description)
GET  verify
PUT  /properties/status/{codpro} only if a documented test status is configured
```

Cleanup is "change status / leave for monthly reset", not DELETE. Do not
call Separate, Unlink, or Retry Portals from CI unless a dedicated fixture
property is reserved.

## Capa 3 — Workflow tests

Location: `test/workflow/`.

n8n community packages cannot import `NodeTestHarness`. Instead, drive a
running n8n through its REST API:

```text
owner setup / login
→ create Domus credential
→ import examples/*.json
→ assign credential
→ POST /rest/workflows/{id}/run
→ assert execution status and item shape
```

```bash
# n8n must already be up (npm run test:docker)
DOMUS_TEST_TOKEN=... npm run test:workflow
```

Sanitized fixtures live in `examples/`. They contain no token and no
credential id. Skip when `N8N_BASE_URL` is down or the token is missing.

This layer proves the packaged node runs inside a real n8n routing engine
without opening the GUI.

## Capa 4 — Docker integration

Unchanged purpose: `scripts/docker-integration.sh` + `docker/compose.yaml`.

```text
build → npm pack → clean volume → install .tgz in official n8n
→ start → export:nodes → assert credential + search/get
→ import example workflow
```

Image pin: `docker.n8n.io/n8nio/n8n:2.35.5` on `127.0.0.1:5680`.
The script waits for `/healthz` and for `Editor is now accessible` before
running `n8n export:nodes`, so the CLI does not race SQLite migrations.
Do not remove this check. Playwright reuses the same instance when it is healthy.

```bash
npm run test:docker
npm run docker:down
```

## Capa 5 — Playwright E2E

Location: `test/e2e/`. Runner: `@playwright/test` (Chromium).
Keep `n8n.strict` and the default `eslint.config.mjs`. Playwright
TypeScript files use file-level disables for Cloud-only rules
(`process`, `node:fs`, `setTimeout`). Do not run
`n8n-node cloud-support disable`.

Aligned with upstream n8n Playwright habits where it is cheap to do so:

- `data-test-id` locators (`getByTestId`)
- auto-waiting, no fixed `sleep` for synchronization
- isolated owner session via REST setup/login
- headless by default

```bash
npm run playwright:install          # once: Chromium
npm run test:e2e                    # starts Docker n8n if needed, then headless
npm run test:e2e:headed             # visible browser
```

Current specs:

| Spec | What it proves |
| ---- | -------------- |
| `community-node.spec.ts` | n8n loads; Domus appears; Property / Search / Get / status operations are visible |
| `credentials.spec.ts` | Domus API credential form: Token field + Testing/Production. Live save uses REST so the token is not typed in the UI |
| `property-search.spec.ts` | Resource/operation Search; optional city locator + execute |
| `property-get.spec.ts` | Property Code field; execute uses a code discovered at runtime |
| `property-status.spec.ts` | Change Status and Get Status History fields; history execute is read-only |

Playwright does **not** assert every query parameter. That belongs in capas 1–2.

### Cursor / browser exploration

While implementing, a browser agent may click through n8n to discover
locators. That exploration is not the suite. Any useful path must be
committed as a Playwright spec before the work is done.

### Sensitive artifacts

Default Playwright config:

- `trace: off`
- `video: off`
- `screenshot: off`

Enable locally with `PLAYWRIGHT_DEBUG=1` (retain-on-failure only). Never
commit `test-results/`, `playwright-report/`, or traces. Live credential
tests create the credential through n8n REST so the token is not typed
into a screenshotable input when avoidable.

Do not run these tests against production Domus.

## Test data

| Need | Source |
| ---- | ------ |
| Any property | First item from `GET /properties?page=1` on testing |
| City option | First `/search/cities` result |
| Specific codes | `DOMUS_TEST_PROPERTY_CODE` optional override |
| Write fixture | Created in-test, unique reference, never a hardcoded production code |

## GitHub Actions

### PR and `main` (`ci.yml`)

No Domus secrets. Safe for forks.

```text
npm ci
lint
build
unit tests
npm pack --dry-run --json
```

### Nightly / manual (`nightly.yml`)

Runs on `workflow_dispatch` and a schedule, **only on this repository**.
Pull requests, including forks, never receive `DOMUS_TEST_TOKEN`.

The scheduled job is **read-only** (`DOMUS_TEST_WRITE=0`):

```text
unit
docker integration
Playwright UX
read-only Domus contract tests
n8n workflow REST
```

Write tests (Create/Update) run only when someone starts the workflow
manually and enables `write_tests`. That job calls
`npm run test:integration:write` against `https://newapi.domus.la`.

Secrets, when added later:

| Secret | Use |
| ------ | --- |
| `DOMUS_TEST_TOKEN` | Testing environment token |

Do not add a production token. Do not pass secrets to `pull_request` from forks
(`pull_request_target` is not used).

## Adding a new operation

1. Unit: method, URL, routing, required fields, output transform.
2. Integration (read): contract assertion or skip.
3. Workflow fixture in `examples/` if the operation is user-facing.
4. Playwright only if the operation introduces new UX (new resource, locator, or destructive confirm).
5. Docker script: add the operation name to the loaded-operations check.
6. Update `docs/api-coverage.md` status and target version.

## Coverage of the current node

Approximate share of `0.1.0` behavior that can be validated without a human:

| Area | Automated | Residual manual |
| ---- | --------- | --------------- |
| Credential shape and auth header | Capa 1 | — |
| Search/Get routing and pagination config | Capa 1 | — |
| Dynamic locator HTTP and filtering | Capa 1 | visual density of the locator popover |
| Package install in clean n8n | Capa 4 | — |
| Node and operations appear in the editor | Capa 5 | fine CSS/layout |
| Credential environment options | Capa 5 | — |
| Live Search/Get against Domus | Capa 2 + 3 + 5 if token | first-time token issuance |
| "Does this look right in a demo video" | — | yes, once per release |

For the two public operations, automated layers cover the contract, package
load, and editor happy path. The remaining 10–20% is visual polish and the
n8n Creator Portal demo, not functional regression.

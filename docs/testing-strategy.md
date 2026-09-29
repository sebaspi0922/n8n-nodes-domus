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
6. `GET /general/amenities` and `GET /general/city-zones` — Search locators
7. `GET /search/digited-neighborhoods` — typed-neighborhood helper (name rows)
8. `GET /properties/status/{codpro}` — nested history envelope
9. `GET /general/{cities,types,biz,zones,neighborhoods}` — Create/Update catalogs
10. `GET /properties/map` — map envelope
11. `GET /general/detach/status`, `GET /administrative/branches`, `GET /general/states`, `GET /general/destinations`, `GET /general/amenities-extra`, and `GET /general/populated-centers?city=` — `1.1.0` catalogs

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
property is reserved. `1.1.0` does not reserve one, so those calls stay out
of the write suite. Advisor Create and Update run in that same manual suite
when `DOMUS_TEST_WRITE=1`. The nightly job never sets that flag.

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
without opening the GUI. The executed example is Property Search. Create,
Update, Separate, Unlink, Advisor writes, and any DELETE are not executed.

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
| `community-node.spec.ts` | n8n loads; Domus appears; Property Search / Get / Create / Update / status operations are visible |
| `credentials.spec.ts` | Domus API credential form: Token field + Testing/Production. Live save uses REST so the token is not typed in the UI |
| `property-search.spec.ts` | Resource/operation Search; optional city locator + execute |
| `property-get.spec.ts` | Property Code field; execute uses a code discovered at runtime |
| `property-status.spec.ts` | Change Status and Get Status History fields; history execute is read-only |
| `property-write.spec.ts` | Create and Update field surfaces; no live write |
| `new-operations.spec.ts` | Search Map, Separate, Unlink, Advisor Create/Update, Branch Search, and the new property catalogs. Writes and DELETE are not executed |
| `crm-meetings.spec.ts` | Domus CRM in the panel; Token without an environment field; Meeting Search dates, type selector, and Profile selector. Create, Update, and Confirm show their own fields and do not execute writes. Opportunity Search, Get, and Create show their own fields. Profile Search shows branch, name, and alternative code. Contact Search shows name and phone. Contact Create and Update show their fields and do not execute. Live Search only with `DOMUS_CRM_TEST_TOKEN` |

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
| `DOMUS_TEST_TOKEN` | Testing environment token for API 3.0 |
| `DOMUS_CRM_TEST_TOKEN` | Domus CRM token for `https://apind.domus.la`. Never the API 3.0 token |

Do not add a production token. Do not pass secrets to `pull_request` from forks
(`pull_request_target` is not used).

## Domus CRM

The CRM node calls `https://apind.domus.la` with `DOMUS_CRM_TEST_TOKEN` for
meetings, opportunities, and profiles. Contacts call `https://api.domus.la`.
That token is separate from `DOMUS_TEST_TOKEN`. The CRM read suite skips when the
CRM token is missing. `requestDomusCrm` allows only `https://apind.domus.la` and
refuses `https://newapi.domus.la`, `https://api.domus.la`, and
`https://api.domus.la/3.0`. Contact reads use `requestDomusContacts`, which
allows only `https://api.domus.la` and refuses `https://api.domus.la/3.0`,
`https://newapi.domus.la`, and `https://apind.domus.la`.

`requestDomusCrm` stays read-only. Meeting and opportunity writes live in
`test/integration/domus-crm-api.write.test.js` and still require exactly
`https://apind.domus.la`. Contact writes in the same file use
`requestDomusContactsWrite` and allow only `https://api.domus.la`. There is no
DELETE. They run only through:

```text
DOMUS_CRM_TEST_TOKEN=... DOMUS_CRM_TEST_WRITE=1 npm run test:integration:crm-write
```

The file skips when the flag or the CRM token is missing. Meeting notes and
opportunity comments use the `n8n-e2e-` prefix. `contact` is sent only when
`DOMUS_CRM_TEST_CONTACT_ID` is set. Opportunity create reads `service_id` from
the first `GET /opportunities/status` row and skips when that row has none. It
does not send `property`. Contact create sends a name with the `n8n-e2e-`
prefix and an email, so phone is not required. It sends `source` only when
`DOMUS_CRM_TEST_SOURCE_ID` is set, and skips when that value is missing. There
is no DELETE, so the test does not clean up. The nightly workflow never sets
`DOMUS_CRM_TEST_WRITE` and does not call `test:integration:crm-write`.
`DOMUS_TEST_WRITE` does not enable these writes.

Example workflows exist for meeting create, update, and confirm, for
opportunity search, get, and create, for profile search, and for contact
search, get, create, and update. They contain no token and no credential id.
The workflow REST test executes Meeting Search, Opportunity Search, Profile
Search, and Contact Search only.

`GET /profiles` is part of the read suite. When a row is present, the test
asserts `code`. It does not call another route and does not paginate. There is
no profile write test. The nightly workflow does not add one.

`GET /contacts` is part of the read suite and calls `https://api.domus.la`.
When a row is present, the test asserts `code` and calls `GET /contacts/{code}`.
It does not paginate.

| Layer | CRM check |
| ----- | --------- |
| 1 | `test/domus-crm-node.test.js` |
| 2 | `test/integration/domus-crm-api.integration.test.js` for reads, including `GET /profiles` and `GET /contacts`. Writes: `test/integration/domus-crm-api.write.test.js` with `DOMUS_CRM_TEST_WRITE=1` |
| 3 | `examples/search-meetings.json`, `examples/search-opportunities.json`, `examples/search-profiles.json`, and `examples/search-contacts.json` through the workflow REST test. Create, update, confirm, opportunity get, and contact get fixtures are not executed |
| 4 | Docker script loads both nodes and both credentials, the 17 property operations, Meeting search, get, create, update, and confirm, Opportunity search, get, and create, Profile search, and Contact search, get, create, and update |
| 5 | `test/e2e/crm-meetings.spec.ts` |

## Adding a new operation

1. Unit: method, URL, routing, required fields, output transform.
2. Integration (read): contract assertion or skip.
3. Workflow fixture in `examples/` if the operation is user-facing.
4. Playwright only if the operation introduces new UX (new resource, locator, or destructive confirm).
5. Docker script: add the operation name to the loaded-operations check.
6. Update `docs/api-coverage.md` status and target version.

## Coverage of the current node

Approximate share of `1.0.0` behavior that can be validated without a human:

| Area | Automated | Residual manual |
| ---- | --------- | --------------- |
| Credential shape and auth header | Capa 1 | — |
| Search/Get/write routing and pagination config | Capa 1 | — |
| Dynamic locator HTTP and filtering | Capa 1 | visual density of the locator popover |
| Package install in clean n8n | Capa 4 | — |
| Node, six resources, and twenty-three operations appear in the editor | Capa 5 | fine CSS/layout |
| Credential environment options | Capa 5 | — |
| Live Search/Get against Domus | Capa 2 + 3 + 5 if token | first-time token issuance |
| Live writes against `newapi.domus.la` | Capa 2 with `DOMUS_TEST_WRITE=1` | confirm the testing host is reset-safe |
| "Does this look right in a demo video" | — | yes, once per release |

For the twenty-three public operations, automated layers cover the contract,
package load, and editor happy path. The remaining 10–20% is visual polish
and a release demo, not functional regression.

# n8n-nodes-domus

An n8n community node for integrating workflows with **Domus CRM** through
Domus API 3.0.

> Published as [`n8n-nodes-domus@0.1.0`](https://www.npmjs.com/package/n8n-nodes-domus).
> That release is the version under n8n Creator Portal review. Later Git
> commits may add docs and tests without publishing a new npm version.

## Features

- Domus API credentials with testing and production environments
- Raw token authentication through `Authorization: <token>` (without `Bearer`)
- Credential test against `GET /general/countries`
- `Property → Search` using `GET /properties`
- `Property → Get` using `GET /properties/{codpro}/{idpro?}`
- `Property → Get Status History` using `GET /properties/status/{codpro}`
- `Property → Change Status` using `PUT /properties/status/{codpro}`
- Bounded results or automatic page-based pagination with **Return All**
- Dynamic selectors for city, property type, business type, zone, neighborhood, status, and source
- Manual code entry as an alternative to every dynamic selector
- One n8n output item per property

## Requirements

- Node.js 24 LTS recommended (`>=22.22.0 <26` is currently supported)
- npm
- Git

The repository pins Node.js `24.19.0` in `.node-version`. The system-wide
Node.js 26 runtime is not used because `isolated-vm` 6.x, a native dependency
of the tested n8n version, does not provide the required Node.js 26 binding.

## Local development

```bash
npm install
npm run dev
```

The development command builds and links the community node, starts an n8n
development instance with hot reload, and exposes it at:

```text
http://localhost:5678
```

The first run may ask you to create a local n8n owner account.

Run the quality checks with:

```bash
npm run lint
npm run build
npm test
npm pack --dry-run --json
```

`0.1.0` was tested with Node.js 24.19.0, `@n8n/node-cli` 0.44.3, and
n8n 2.35.5.

## Credentials

Create a credential of type **Domus API** and configure:

- **Token**: the access token supplied by Domus. n8n stores it encrypted and
  sends it directly in the `Authorization` header. Do not add `Bearer`.
- **Environment**:
  - **Testing**: `https://newapi.domus.la`
  - **Production**: `https://api.domus.la/3.0`

Domus resets the testing environment on the first day of every month. Use
production when you need to query real property inventory.

Never store a token in the repository, `.env` files, fixtures, logs,
screenshots, or example workflows.

## Usage

1. Start development mode and open `http://localhost:5678`.
2. Create or open a workflow.
3. Add the **Domus** node.
4. Create or select a **Domus API** credential.
5. Select **Property** and choose an operation.
6. Configure the operation and execute the node.

Sanitized importable workflows are available under [`examples/`](examples/).
Assign your own Domus credential after importing them; the examples contain
no token or credential identifier.

## Operations

### Property → Search

Calls `GET /properties` with the Domus `Perpage`, `Inmobiliaria`, and `Ficha`
headers. Available filters include:

- property code
- reference
- keyword
- city
- property type
- business type
- Colombian socioeconomic stratum
- zone
- neighborhood name or code

With **Return All** disabled, **Limit** controls both the maximum number of
items and the requested page size. When **Return All** is enabled, the node
follows `current_page` and `last_page` automatically, starting at **Page** and
using **Results Per Page** for each request. Filters are preserved across
pages.

City, property type, business type, zone, and neighborhood use Domus search
endpoints to provide live options for the selected agency scope. Each selector
also supports **By Code** for one or more comma-separated codes. Zone and
neighborhood options are scoped to the selected city when applicable.

### Property → Get

Calls `GET /properties/{codpro}/{idpro?}` and returns the response `data`
object directly as one n8n item.

- **Property Code** (`codpro`) is required.
- **Internal Property ID** (`idpro`) is optional and identifies a specific
  record when necessary.
- **Entire Agency** and **Include Property Sheet** control the `Inmobiliaria`
  and `Ficha` headers.
- Additional options can request map data with a zoom level and owner
  information when the token has the required permissions.

Authentication, not-found, HTTP, and network failures are propagated as n8n
execution errors instead of being converted into successful output.

### Property → Get Status History

Calls `GET /properties/status/{codpro}` and returns each recorded status
change as an n8n item. Pagination is nested under `data` in the Domus
response; the node flattens that list and can follow pages with
**Return All**.

### Property → Change Status

Calls `PUT /properties/status/{codpro}` with
`application/x-www-form-urlencoded`. **Status** is required and can be
chosen from `GET /general/status` or entered by code. Optional fields
include comment, change date, deal value, source, broker, and partner
agency.

Do not use this operation to reserve or separate a property. Domus
documents a dedicated Separate endpoint for that, which is not in this
slice. Created properties cannot be deleted; status is the documented
lifecycle control. Write only against the testing host unless you
intentionally target production.

## Verified behavior

The node has been exercised against Domus API with a real credential without
storing the token or response fixtures in this repository. Manual verification
covered:

- real property search and downstream field mapping
- bounded results and automatic pagination across 115 properties
- dynamic and manual-code filters
- property detail by code and optional internal ID
- property sheet and whole-agency headers
- invalid credentials, a missing property (`404`), and a refused connection

## Docker integration test

The reproducible integration test uses the official
`docker.n8n.io/n8nio/n8n:2.35.5` image, an isolated volume, and port `5680`.
It does not share data with the development instance.

With Node.js 24 active and Docker available, run:

```bash
npm run test:docker
```

The script performs:

```text
build → npm pack → clean volume → install .tgz → start n8n → inspect loaded node
```

The package is written to the ignored `artifacts/` directory. The test installs
it in `/home/node/.n8n/nodes`, starts n8n, and verifies the `domusApi`
credential plus the `search` and `get` operations.

Open the clean instance at:

```text
http://localhost:5680
```

Enter the token manually in n8n only when testing a live request. Remove the
disposable container and its isolated volume afterward with:

```bash
npm run docker:down
```

## Automated testing

Layered checks are documented in
[`docs/testing-strategy.md`](docs/testing-strategy.md).

```bash
npm test
npm run test:integration          # read-only; skips without DOMUS_TEST_TOKEN
npm run test:integration:write    # manual only; requires DOMUS_TEST_WRITE=1
npm run test:docker
npm run playwright:install        # once
npm run test:e2e                  # reuses the Docker n8n on port 5680
```

Copy [`.env.example`](.env.example) to a local `.env` for optional live tests.
Never put a Domus token in Git, fixtures, traces, or screenshots.

## Release status

`n8n-nodes-domus@0.1.0` is published to npm with provenance from GitHub
Actions. It is in n8n Creator Portal Manual Review. Do not publish `0.1.1`,
`0.2.0`, `1.0.0`, or any other npm version while that review is open. The
next public package after review is `1.0.0`.

## Documentation

- [API coverage and roadmap](docs/api-coverage.md)
- [Testing strategy](docs/testing-strategy.md)
- [First-stage report](docs/first-stage-report.md)
- [Second-stage report](docs/second-stage-report.md)
- [Domus API 3.0](https://apiv3get.domus.la/docs/3.0/)
- [Property list endpoint](https://apiv3get.domus.la/docs/3.0/inmuebles/lista)
- [Property detail endpoint](https://apiv3get.domus.la/docs/3.0/inmuebles/detalle)
- [n8n community node verification guidelines](https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines)
- [n8n node CLI](https://docs.n8n.io/connect/create-nodes/build-your-node/using-the-n8n-node-tool/)

## License

[MIT](LICENSE)

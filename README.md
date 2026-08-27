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
- `Property → Create` using `POST /properties`
- `Property → Update` using `PUT /properties/{codpro}`
- `Property → Get Status History` using `GET /properties/status/{codpro}`
- `Property → Change Status` using `PUT /properties/status/{codpro}`
- `Owner → Search` using `GET /owners`
- `Owner → Get` using `GET /owners/{document}`
- `Owner → Create` using `POST /owners`
- `Owner → Update` using `PUT /owners/{document}`
- Bounded results or automatic page-based pagination with **Return All**
- Dynamic selectors for city, property type, business type, zone, neighborhood, city zone, amenities, status, source, advisor, branch, document type, and phone type
- Manual code entry as an alternative to every dynamic selector
- One n8n output item per property or owner

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
5. Select **Property** or **Owner** and choose an operation.
6. Configure the operation and execute the node.

Sanitized importable workflows are available under [`examples/`](examples/).
Assign your own Domus credential after importing them; the examples contain
no token or credential identifier.

## Operations

### Property → Search

Calls `GET /properties` with the Domus `Perpage`, `Inmobiliaria`, and `Ficha`
headers. Available filters include:

- property code, multiple property codes, and reference
- keyword
- city, city zone, zone, and neighborhood name or code
- property type and business type
- Colombian socioeconomic stratum
- status, or every status (`nostatus=0`)
- amenities (any match or match-all)
- sale and rent price ranges, bedroom/bathroom ranges, and built-area range
- broker code and branch code
- updated since a date (`YYYY-MM-DD`)
- sort field and direction

With **Return All** disabled, **Limit** controls both the maximum number of
items and the requested page size. When **Return All** is enabled, the node
follows `current_page` and `last_page` automatically, starting at **Page** and
using **Results Per Page** for each request. Filters are preserved across
pages.

City, property type, business type, zone, and neighborhood use Domus search
endpoints to provide live options for the selected agency scope. Status,
amenities, and city zone use the full catalogs. Each selector also supports
**By Code** for one or more comma-separated codes. Zone, neighborhood, and
city-zone options are scoped to the selected city when applicable. Amenity
options are scoped to the selected property type when applicable.

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

### Property → Create

Calls `POST /properties` with `application/x-www-form-urlencoded`. Required
fields are **City**, **Address**, **Business Type**, and **Property Type**.
Those locators use the full `/general/*` catalogs so a listing can be created
in a city or type that does not already have inventory.

**Rent** is required by Domus when business type is 1 or 3; **Sale Price**
when it is 2 or 3. Neighborhood can be a catalog code or a typed name in
**Additional Fields**. Zone or city zone may also be required by the agency.

Created properties **cannot be deleted**. Use **Change Status** to take them
out of inventory. Prefer the testing host unless you intend to create a live
listing. Image upload, extra amenities JSON, and multilingual descriptions
are not in this slice.

### Property → Update

Calls `PUT /properties/{codpro}` with `application/x-www-form-urlencoded`.
**Property Code** is required. Every commercial field is optional; **Status**
is not available here. Use **Change Status** for lifecycle updates. An
optional **Delete Pictures** flag maps to `delete_pictures`.

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

### Owner → Search

Calls `GET /owners` and returns one n8n item per owner. Filters cover
branch, city, name, phone, exact phone, email, document, property code,
and the two flags for owners that have an email or active properties.
Results can be ordered by first name, last name, or code. **Return All**
follows pages the same way the property search does.

### Owner → Get

Calls `GET /owners/{document}` and returns the owner with their phones and
associated properties. Domus expects the identification document in the
path; send `0` and set **Owner Code** when the document is unknown. An
optional **Property Status** filter narrows the associated properties.

### Owner → Create

Calls `POST /owners` with `application/x-www-form-urlencoded`. **First
Name**, **Last Name**, and **Document** are required. Phones are entered
one per row and sent as the JSON array Domus documents, with types loaded
from `GET /general/phone-types`. Passing **Property Code** and **Share
Percentage** associates the new owner with a property in the same request.

### Owner → Update

Calls `PUT /owners/{document}` with `application/x-www-form-urlencoded`.
Every field is optional, including the document itself, which Domus
rewrites when it is sent. **Replace Phone List** maps to `phones_recursive`
and is required when phones are sent in the same shape as owner creation.

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
- [Owner list endpoint](https://apiv3get.domus.la/docs/3.0/propietarios/lista)
- [Owner detail endpoint](https://apiv3get.domus.la/docs/3.0/propietarios/detalle)
- [n8n community node verification guidelines](https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines)
- [n8n node CLI](https://docs.n8n.io/connect/create-nodes/build-your-node/using-the-n8n-node-tool/)

## License

[MIT](LICENSE)

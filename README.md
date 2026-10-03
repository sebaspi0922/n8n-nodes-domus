# n8n-nodes-domus

An n8n community node for integrating workflows with **Domus**. Property, owner, advisor, branch, project, and acquisition operations use Domus API 3.0. Meeting, opportunity, and profile operations use `https://apind.domus.la`, and contacts use `https://api.domus.la`, each with its own token.

> [`n8n-nodes-domus@1.0.0`](https://www.npmjs.com/package/n8n-nodes-domus)
> is the n8n-verified release. `1.1.0` adds Search Map, Separate, Owner
> Unlink, advisor writes, Branch Search, and the remaining catalog selectors.

## Features

- Domus API credentials with testing and production environments
- Raw token authentication through `Authorization: <token>` (without `Bearer`)
- Credential test against `GET /general/countries`
- `Property → Search` using `GET /properties`
- `Property → Search Map` using `GET /properties/map`
- `Property → Get` using `GET /properties/{codpro}/{idpro?}`
- `Property → Create` using `POST /properties`
- `Property → Update` using `PUT /properties/{codpro}`
- `Property → Get Status History` using `GET /properties/status/{codpro}`
- `Property → Change Status` using `PUT /properties/status/{codpro}`
- `Property → Get Portal Publications` using `GET /properties/portals/{idpro}/{codpro?}`
- `Property → Retry Portal Publication` using
  `GET /properties/retry-portals/{codpro}/{idpro?}`
- `Property → Separate` using `PUT /properties/detach/{codpro}`
- `Owner → Search` using `GET /owners`
- `Owner → Get` using `GET /owners/{document}`
- `Owner → Create` using `POST /owners`
- `Owner → Update` using `PUT /owners/{document}`
- `Owner → Unlink Property` using `DELETE /owners/{owner_code}/{codpro}`
- `Advisor → Search` using `GET /administrative/brokers`
- `Advisor → Create` using `POST /administrative/brokers`
- `Advisor → Update` using `PUT /administrative/brokers/{code}`
- `Branch → Search` using `GET /administrative/branches`
- `Project → Search` using `GET /projects-v2`
- `Project → Get` using `GET /projects-v2/{code}?unique_code=`
- `Acquisition → Search` using `GET /captures-v2`
- `Acquisition → Get` using `GET /captures-v2/{code}?unique_code=`
- Bounded results or automatic page-based pagination with **Return All**
- Dynamic selectors for city, country, department, property type, business type, zone, neighborhood, city zone, populated center, amenities, extra amenities, destination, status, separation status, source, advisor, branch, document type, and phone type
- Manual code entry as an alternative to every dynamic selector
- One n8n output item per property, owner, advisor, branch, project, or acquisition

## Requirements

- An n8n instance (Cloud or self-hosted) that can install community nodes
- A Domus API token (request it from Domus support)

Node.js 24 LTS is required only for local development of this package
(`>=22.22.0 <26`). The repository pins `24.19.0` in `.node-version`.

## Installation

On n8n Cloud and on self-hosted instances with verified community nodes
enabled, install **Domus** from the nodes panel.

On self-hosted n8n without that listing, install the npm package from
**Settings → Community Nodes** as `n8n-nodes-domus`.

The GitHub repository stays public so later versions can keep Creator Portal
verification and npm provenance.

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

1. Open n8n and create or open a workflow.
2. Add the **Domus** node.
3. Create or select a **Domus API** credential.
4. Select **Property**, **Owner**, **Advisor**, **Branch**, **Project**, or
   **Acquisition** and choose an operation.
5. Configure the operation and execute the node.

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

**Department** narrows the city catalog and is not sent on the property.
**Populated Center** and **Destination** are catalog locators.
**Extra Amenities** lists `GET /general/amenities-extra` and does not send
the `amenities_extra` JSON body.

Created properties **cannot be deleted**. Use **Change Status** to take them
out of inventory. Prefer the testing host unless you intend to create a live
listing. Image upload, the extra-amenities JSON body, and multilingual
descriptions are not in this release.

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

Do not use this operation to reserve or separate a property. Use
**Property → Separate**, which calls `PUT /properties/detach/{codpro}`.
Created properties cannot be deleted; status is the documented lifecycle
control besides a reservation. Write only against the testing host unless
you intentionally target production.

### Property → Search Map

Calls `GET /properties/map` and returns one n8n item per pin (`idpro`,
`codpro`, `latitude`, `longitude`). Headers and filters follow the property
list: **Perpage**, **Inmobiliaria**, and the same commercial filters the map
page documents, including **Destination** and **Polygon**. **Return All**
follows `current_page` and `last_page`.

### Property → Separate

Calls `PUT /properties/detach/{codpro}` with
`application/x-www-form-urlencoded`. The path is `detach`. **Status** comes
from `GET /general/detach/status`. Optional fields are days, comment, and
value. This reserves the property. It does not delete it.

### Property → Get Portal Publications

Calls `GET /properties/portals/{idpro}/{codpro?}` and returns one n8n item per
portal publication, including the portal, the business type, the code the
property has on that portal, and the sync dates. Domus puts the internal
property ID first here, so **Internal Property ID** is required and
**Property Code** only narrows the lookup. **Entire Agency** controls the
`Inmobiliaria` header.

### Property → Retry Portal Publication

Calls `GET /properties/retry-portals/{codpro}/{idpro?}` and requeues a portal
transaction that failed, without editing the property. **Property Code** is
required and **Transaction** selects create, update, or unpublish
(`method=1|2|3`).

Domus documents this path in its request example while the page badge reuses
the publications path. The node follows the request example, because the badge
path collides with the publications endpoint. Retrying is not idempotent: each
call queues another portal transaction.

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

### Owner → Unlink Property

Calls `DELETE /owners/{owner_code}/{codpro}`. **Owner Code** is the owner
code, not the identification document. **Property Code** is the associated
listing. The call removes that association. The owner record stays.

### Advisor → Search

Calls `GET /administrative/brokers` and returns one n8n item per advisor,
including identification, phones, email, picture, department, and city.
Filters cover branch, city, name, phone, email, and exact email, and results
can be ordered by code, display order, email, first name, or last name.

Domus does not paginate this endpoint, so it always answers with the complete
list. Disabling **Return All** truncates that list to **Limit** items inside
n8n; it does not make a smaller request.

There is no documented get-by-id for a single advisor.

### Advisor → Create

Calls `POST /administrative/brokers` with
`application/x-www-form-urlencoded`. **First Name**, **Last Name**, and
**Document** are required. Phone or mobile phone is required when the other
is empty. The response unwraps `broker`.

### Advisor → Update

Calls `PUT /administrative/brokers/{code}` with the same form fields, all
optional, plus **Status** (`1` active, `2` inactive). Send only the fields
that should change.

### Branch → Search

Calls `GET /administrative/branches` and returns one n8n item per branch.
Domus does not paginate this endpoint. Disabling **Return All** truncates
the list inside n8n. The same directory still feeds the branch selector on
other operations.

### Project → Search

Calls `GET /projects-v2` and returns one n8n item per project, with its price
and area ranges, pictures, branch, and agency. Filters cover city, country,
branch, neighborhood, name, project code, and status, plus **Any Status** for
`nostatus=0`. **Return All** follows `current_page` and `last_page` the same
way the property and owner searches do.

This resource is Domus CRM V2 inventory. Domus documents `GET /projects` as a
separate MLS list that holds different inventory, so it is intentionally not
exposed here.

### Project → Get

Calls `GET /projects-v2/{code}` and returns the project `data` object with its
unit types, price rows, and pictures. **Project Code** is required; send `0`
and set **Unique Code** for projects the agency never assigned a code to.

### Acquisition → Search

Calls `GET /captures-v2` and returns one n8n item per acquisition, each
carrying the property snapshot, the capturing advisor, the CRM contact, and
the branch. Filters cover city, branch, neighborhood, business type, property
type, stratum, advisor, CRM contact, and ranges for area, value,
administration, bedrooms, and bathrooms. **Return All** follows pages the same
way the other searches do.

This is the closest documented CRM intake surface in API 3.0. There is no
standalone leads or contacts module, and no create or update endpoint for
acquisitions, so this resource is read-only.

### Acquisition → Get

Calls `GET /captures-v2/{code}` and returns the acquisition `data` object.
**Acquisition Code** is required; send `0` and set **Unique Code** for
acquisitions the agency never assigned a code to.

## Verified behavior

`1.1.0` exposes twenty-three public operations across Property, Owner,
Advisor, Branch, Project, and Acquisition. The Domus node stays on version
1. Routing, pagination, locators, and example
workflows are covered by the automated suite in
[`docs/testing-strategy.md`](docs/testing-strategy.md).

Live checks against Domus API used a real credential without storing the
token or response fixtures in this repository. Those checks covered:

- property search and downstream field mapping
- bounded results and automatic pagination across 115 properties
- dynamic and manual-code filters
- property detail by code and optional internal ID
- property sheet and whole-agency headers
- invalid credentials, a missing property (`404`), and a refused connection
- write operations only against `https://newapi.domus.la` (created records
  cannot be deleted; use **Change Status** to retire them)

## Local development

Node.js 24 LTS is recommended (`>=22.22.0 <26`). The repository pins
`24.19.0` in `.node-version`. The system-wide Node.js 26 runtime is not used
because `isolated-vm` 6.x, a native dependency of the tested n8n version,
does not provide the required Node.js 26 binding.

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

`1.0.0` was tested with Node.js 24.19.0, `@n8n/node-cli` 0.44.3, and
n8n 2.35.5.

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
credential, all six resources, all twenty-three operations, and every packaged
example workflow.

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

[`n8n-nodes-domus@1.0.0`](https://www.npmjs.com/package/n8n-nodes-domus) is
the n8n-verified release. It was published with provenance from GitHub Actions
and verified through the n8n Creator Portal. `0.1.0` remains on npm as the
earlier two-operation package.

`1.1.0` adds Search Map, Separate, Owner Unlink, Advisor Create and Update,
Branch Search, and the department, populated-center, extra-amenities, and
destination selectors. Image upload, the `amenities_extra` JSON body,
multilingual descriptions, per-entry owner phone edits, MLS projects,
partners, and tags stay out.

`1.2.0` adds Meeting, Opportunity, Profile, and Contact.

`1.3.0` keeps those resources on the Domus node. Inventory operations use the Domus API credential. Meetings, opportunities, profiles, and contacts use the Domus CRM API credential.

`1.3.1` drops the `VersionedNodeType` split (`DomusV1.ts`, `DomusV2.ts`) that the
n8n community node scanner rejects. The whole node now lives in
`Domus.node.ts` with light versioning (`version: [1, 2]`, default `2`), so
workflows saved on version 1 keep loading. To publish a later version:

```bash
npm run release
```

That lints, builds, bumps the version, regenerates the changelog, commits, and
pushes the tag, which triggers the publish workflow. The GitHub repository
must stay public for Creator Portal checks and npm provenance.

## Documentation

- [API coverage and roadmap](docs/api-coverage.md)
- [Testing strategy](docs/testing-strategy.md)
- [First-stage report](docs/first-stage-report.md)
- [Second-stage report](docs/second-stage-report.md)
- [Third-stage report](docs/third-stage-report.md)
- [Domus API 3.0](https://apiv3get.domus.la/docs/3.0/)
- [Property list endpoint](https://apiv3get.domus.la/docs/3.0/inmuebles/lista)
- [Property detail endpoint](https://apiv3get.domus.la/docs/3.0/inmuebles/detalle)
- [Owner list endpoint](https://apiv3get.domus.la/docs/3.0/propietarios/lista)
- [Owner detail endpoint](https://apiv3get.domus.la/docs/3.0/propietarios/detalle)
- [Advisor list endpoint](https://apiv3get.domus.la/docs/3.0/administrativo/asesores)
- [Project V2 list endpoint](https://apiv3get.domus.la/docs/3.0/proyectos-v2/lista)
- [Acquisition V2 list endpoint](https://apiv3get.domus.la/docs/3.0/captaciones-v2/lista)
- [n8n community node verification guidelines](https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines)
- [n8n node CLI](https://docs.n8n.io/connect/create-nodes/build-your-node/using-the-n8n-node-tool/)

## License

[MIT](LICENSE)

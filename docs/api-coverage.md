# Domus API 3.0 coverage

Living map of every endpoint documented in [Domus API 3.0](https://apiv3get.domus.la/docs/3.0/).
Source of truth: official LaRecipe pages crawled on 2026-08-22. Contracts below come
from those pages, not from guessed OpenAPI.

- Documentation index: 51 pages (2 introductory, 49 endpoint pages)
- Documented HTTP operations: **50**, counting `GET /administrative/document_types`, which has a live docs page linked from owner creation but no entry in the sidebar
- Public n8n operations in published `0.1.0`: **2** (`Property → Search`, `Property → Get`)
- Public n8n operations on this branch (unpublished): **12** (eight on Property, four on Owner)
- Dynamic selectors already implemented: cities, property types, business types, zones, neighborhoods, statuses, sources, amenities, city zones, typed neighborhoods, advisors, branches, document types, phone types, plus full `/general` catalogs for create and update

`n8n-nodes-domus@0.1.0` is published to npm and is in n8n Creator Portal
Manual Review. Do not publish a new npm version while that review is open.
The next public package is **`1.0.0`**, not `0.2.0`. Work lands in small
git batches; clients should not see another `0.x` release.

## Authentication and environments

From [Comenzar](https://apiv3get.domus.la/docs/3.0/comenzar):

| Item | Official value |
| ---- | -------------- |
| Production | `https://api.domus.la/3.0` |
| Testing | `https://newapi.domus.la` |
| Auth header | `Authorization: <TOKEN>` without `Bearer` |
| Token source | Agency request to Domus support |
| Testing reset | First day of every month; created properties, photos, and features are wiped |
| Testing caveat | Domus says the testing environment is not appropriate for querying real inventory |

Every documented request requires `Authorization`. Additional headers such as
`Inmobiliaria`, `Perpage`, `Ficha`, `Mapa`, and `Propietario` are endpoint-specific.

## Proposed n8n resources

UX grouping for the node, not a 1:1 copy of the Domus sidebar.

```text
Domus
├── Property
├── Owner
├── Advisor
├── Project
├── Acquisition
└── Branch            (small; optional public resource)
```

Catalog, search-facet, and status lists stay as **helpers** that feed
resource locators and create/update forms. They should not appear as a
user-facing `Catalog → List Countries` style resource unless a later
release proves a concrete automation need.

### Property

| Operation | API | Role |
| --------- | --- | ---- |
| Search | `GET /properties` | Public |
| Get | `GET /properties/{codpro}/{idpro?}` | Public |
| Search Map | `GET /properties/map` | Public, specialized |
| Create | `POST /properties` | Public write |
| Update | `PUT /properties/{codpro}` | Public write |
| Change Status | `PUT /properties/status/{codpro}` | Public write |
| Get Status History | `GET /properties/status/{codpro}` | Public |
| Get Portal Publications | `GET /properties/portals/{idpro}/{codpro?}` | Public |
| Retry Portal Publication | `GET /properties/retry-portals/{codpro}/{idpro?}` | Public write-ish |
| Separate | `PUT /properties/detach/{codpro}` | Public write |

### Owner

| Operation | API | Role |
| --------- | --- | ---- |
| Search | `GET /owners` | Public |
| Get | `GET /owners/{document}` | Public |
| Create | `POST /owners` | Public write |
| Update | `PUT /owners/{code}` | Public write |
| Unlink Property | `DELETE /owners/{owner_code}/{codpro}` | Public, destructive association |

### Advisor

| Operation | API | Role |
| --------- | --- | ---- |
| Search | `GET /administrative/brokers` | Public |
| Create | `POST /administrative/brokers` | Public write |
| Update | `PUT /administrative/brokers/{code}` | Public write |

There is no documented get-by-id for a single advisor.

### Project

Prefer Domus V2. Official docs state that `GET /projects` is the MLS list and
is **not** the same inventory as CRM Domus V2.

| Operation | API | Role |
| --------- | --- | ---- |
| Search | `GET /projects-v2` | Public |
| Get | `GET /projects-v2/{code}?unique_code=` | Public |
| Search (MLS) | `GET /projects` | Deferred |
| Get (MLS) | `GET /projects/{code}/{unique_code?}` | Deferred |

### Acquisition

| Operation | API | Role |
| --------- | --- | ---- |
| Search | `GET /captures-v2` | Public |
| Get | `GET /captures-v2/{code}?unique_code=` | Public |

This is the closest documented CRM-intake surface. There is no standalone
Leads or Contacts module in API 3.0. Capture list filters include `contact`
(CRM contact id).

### Branch

| Operation | API | Role |
| --------- | --- | ---- |
| Search | `GET /administrative/branches` | Public or helper |

Useful as a locator when creating properties or owners with `branch`.

## Coverage matrix

Statuses: `Implemented`, `Planned`, `Helper`, `Deferred`.

| Domus module | Endpoint | Method | n8n resource | Operation | Status | Priority | Target version |
| ------------ | -------- | ------ | ------------ | --------- | ------ | -------- | -------------- |
| Inmuebles | `/properties` | GET | Property | Search | Implemented | P0 | 1.0.0 |
| Inmuebles | `/properties/{codpro}/{idpro?}` | GET | Property | Get | Implemented | P0 | 0.1.0 |
| Inmuebles | `/properties` | POST | Property | Create | Implemented | P0 | 1.0.0 |
| Inmuebles | `/properties/{codpro}` | PUT | Property | Update | Implemented | P0 | 1.0.0 |
| Inmuebles | `/properties/status/{codpro}` | PUT | Property | Change Status | Implemented | P0 | 1.0.0 |
| Inmuebles | `/properties/status/{codpro}` | GET | Property | Get Status History | Implemented | P1 | 1.0.0 |
| Inmuebles | `/properties/portals/{idpro}/{codpro?}` | GET | Property | Get Portal Publications | Implemented | P1 | 1.0.0 |
| Inmuebles | `/properties/retry-portals/{codpro}/{idpro?}` | GET | Property | Retry Portal Publication | Implemented | P1 | 1.0.0 |
| Inmuebles | `/properties/map` | GET | Property | Search Map | Planned | P2 | 1.1.0 |
| Inmuebles | `/properties/detach/{codpro}` | PUT | Property | Separate | Planned | P2 | 1.1.0 |
| Propietarios | `/owners` | GET | Owner | Search | Implemented | P0 | 1.0.0 |
| Propietarios | `/owners/{document}` | GET | Owner | Get | Implemented | P0 | 1.0.0 |
| Propietarios | `/owners` | POST | Owner | Create | Implemented | P1 | 1.0.0 |
| Propietarios | `/owners/{document}` | PUT | Owner | Update | Implemented | P1 | 1.0.0 |
| Propietarios | `/owners/{owner_code}/{codpro}` | DELETE | Owner | Unlink Property | Planned | P2 | 1.1.0 |
| Administrativo | `/administrative/brokers` | GET | Advisor | Search | Planned | P1 | 1.0.0 |
| Administrativo | `/administrative/brokers` | POST | Advisor | Create | Planned | P2 | 1.2.0 |
| Administrativo | `/administrative/brokers/{code}` | PUT | Advisor | Update | Planned | P2 | 1.2.0 |
| Proyectos V2 | `/projects-v2` | GET | Project | Search | Planned | P1 | 1.0.0 |
| Proyectos V2 | `/projects-v2/{code}` | GET | Project | Get | Planned | P1 | 1.0.0 |
| Captaciones V2 | `/captures-v2` | GET | Acquisition | Search | Planned | P1 | 1.0.0 |
| Captaciones V2 | `/captures-v2/{code}` | GET | Acquisition | Get | Planned | P1 | 1.0.0 |
| Administrativo | `/administrative/branches` | GET | Branch | Search | Planned | P2 | 1.2.0 |
| Administrativo | `/administrative/sources` | GET | — | Change-status locator | Helper | P1 | 1.0.0 |
| Administrativo | `/administrative/document_types` | GET | Owner | Document-type locator | Helper | P1 | 1.0.0 |
| Administrativo | `/administrative/partners` | GET | — | — | Deferred | P3 | — |
| Búsqueda | `/search/cities` | GET | Property | City locator | Helper | P0 | 0.1.0 |
| Búsqueda | `/search/types` | GET | Property | Property Type locator | Helper | P0 | 0.1.0 |
| Búsqueda | `/search/biz` | GET | Property | Business Type locator | Helper | P0 | 0.1.0 |
| Búsqueda | `/search/zones` | GET | Property | Zone locator | Helper | P0 | 0.1.0 |
| Búsqueda | `/search/neighborhoods` | GET | Property | Neighborhood locator | Helper | P0 | 0.1.0 |
| Búsqueda | `/search/digited-neighborhoods` | GET | Property | Typed-neighborhood helper | Helper | P2 | 1.0.0 |
| Generales | `/general/countries` | GET | Credential | Credential test | Helper | P0 | 0.1.0 |
| Generales | `/general/status` | GET | Property | Status locator | Helper | P0 | 1.0.0 |
| Generales | `/general/detach/status` | GET | Property | Separation-status locator | Helper | P2 | 1.1.0 |
| Generales | `/general/biz` | GET | Property | Full business-type catalog | Helper | P1 | 1.0.0 |
| Generales | `/general/types` | GET | Property | Full property-type catalog | Helper | P1 | 1.0.0 |
| Generales | `/general/states` | GET | Property / Owner | Department locator | Helper | P2 | 1.0.0 |
| Generales | `/general/cities` | GET | Property / Owner | Full city catalog | Helper | P1 | 1.0.0 |
| Generales | `/general/zones` | GET | Property | Full zone catalog | Helper | P1 | 1.0.0 |
| Generales | `/general/city-zones` | GET | Property | City-zone locator | Helper | P1 | 1.0.0 |
| Generales | `/general/populated-centers` | GET | Property | Populated-center locator | Helper | P2 | 1.0.0 |
| Generales | `/general/neighborhoods` | GET | Property | Full neighborhood catalog | Helper | P1 | 1.0.0 |
| Generales | `/general/amenities` | GET | Property | Amenities locator | Helper | P1 | 1.0.0 |
| Generales | `/general/amenities-extra` | GET | Property | Extra-amenities locator | Helper | P2 | 1.0.0 |
| Generales | `/general/destinations` | GET | Property | Destination locator | Helper | P2 | 1.0.0 |
| Generales | `/general/phone-types` | GET | Owner | Phone-type locator | Helper | P1 | 1.0.0 |
| Generales | `/general/tags` | GET | — | — | Deferred | P3 | — |
| Proyectos | `/projects` | GET | Project | Search (MLS) | Deferred | P3 | — |
| Proyectos | `/projects/{code}/{unique_code?}` | GET | Project | Get (MLS) | Deferred | P3 | — |

`/administrative/brokers` and `/administrative/branches` are already wired as
resource locators for the `broker`, `catcher_broker`, `promoter_broker`, and
`branch` fields on Property Search, Create, Update, and Change Status. Exposing
them as user-facing Advisor and Branch resources is a separate concern and stays
scheduled for batch C and 1.2.0.

## Roadmap

`0.1.0` is published and under n8n Creator Portal review. Do not publish
another npm version while that review is open. Later work lands on git
in small batches; the next public package is **`1.0.0`**. Internal `0.2`–`0.6`
labels are retired so clients never see another pre-1.0 release.

| Batch | Theme | Public operations | npm |
| ----- | ----- | ----------------- | --- |
| **Published** | Read inventory | Property Search, Property Get. Helpers: `/search/{cities,types,biz,zones,neighborhoods}`, credential test on `/general/countries`. | **0.1.0** |
| **A** | Property writes and status | Search commercial filters, Change Status, Get Status History, Create, and Update. Images, extra-amenities JSON, and multilingual descriptions stay out of this slice. | unpublished until 1.0 |
| **B** | Owners and portals | Owner Search/Get/Create/Update with phone-type and document-type helpers. Property Get Portal Publications and Retry Portal Publication, on the paths the Guzzle examples document. | unpublished until 1.0 |
| **C** | People and projects | Advisor Search. Project V2 Search/Get. | unpublished until 1.0 |
| **D** | CRM intake | Acquisition Search/Get. | unpublished until 1.0 |
| **1.0.0** | Stable core | All P0 and P1 public operations above, with automated tests per operation. MLS v1 projects and partners stay out. | **first post-review publish** |
| **1.1.0** | Reservations and map | Property Search Map, Separate, Owner Unlink, detach-status helper. | after 1.0 |
| **1.2.0** | Agency writes | Advisor Create/Update. Branch as a small resource. | after 1.0 |
| **1.3.0** | Settled public surface | Remaining catalogs, examples, and Cloud listing polish. | the version to point agencies at |

Keep pull requests small and coherent. Do not ship 40 endpoints in one change.

## Classification notes

**Public operation** when a workflow author would select it on purpose:
search/get/create/update a business record, change status, publish, or unlink.

**Helper** when the call only feeds a dropdown, locator, or credential test.
`/search/*` is preferred over `/general/*` for property filters because Domus
documents that search endpoints return only values that already have inventory
in the token's agency or branch.

**Deferred / skip**

| Endpoint | Why |
| -------- | --- |
| `GET /projects` and `GET /projects/{code}` | Officially a different MLS inventory, not CRM Domus V2. Exposing both under one Project resource would confuse users. |
| `GET /administrative/partners` | Ally directory; no write API and weak automation demand compared with inventory, owners, and portals. |
| `GET /general/tags` | Catalog without a documented attach/filter contract on the property list. |
| Commented `administrativo/grupos` | Present in the sidebar as HTML comment only; not a live docs page. |

No documented webhook, trigger, lead inbox, appointment, or contract module
exists in API 3.0. AI-agent use should go through Property, Owner, Acquisition,
and Advisor — the node is already `usableAsTool: true`.

## Official path discrepancies

Documented badges and Guzzle examples disagree in three places. Prefer the
**Guzzle path** when implementing: that is the concrete request Domus shows.

| Page | Badge | Guzzle example | Use in n8n |
| ---- | ----- | -------------- | ---------- |
| Reintentar publicación | `GET /properties/portals/{codpro}/{idpro?}` | `GET /properties/retry-portals/1234/4567` | `/properties/retry-portals/{codpro}/{idpro?}` |
| Separar inmueble | `PUT /properties/deatch/123` | `PUT /properties/detach/123` | `/properties/detach/{codpro}` |
| Estados de separación | `GET /general/deatch/status` | `GET /general/detach/status` | `/general/detach/status` |
| Actualización de propietario | Page text: the URL number is the owner document | `PUT /owners/123456`, which reads like a code | `/owners/{document}`, matching owner detail |

The retry badge also collides with the publications endpoint
`GET /properties/portals/{idpro}/{codpro?}`, so the node implements
`/properties/retry-portals/{codpro}/{idpro?}` from the Guzzle example. Note
that the two portal endpoints take their path segments in opposite orders:
publications is `{idpro}/{codpro?}` and retry is `{codpro}/{idpro?}`.

## Endpoint inventory

All requests: header `Authorization` required, raw token, not Bearer.
Unless noted, bodies are `application/x-www-form-urlencoded` (`form_params`).
Domus warns not to put write fields on the query string.

### Inmuebles

#### Search properties — `GET /properties`

- **Docs:** https://apiv3get.domus.la/docs/3.0/inmuebles/lista
- **Description:** Paginated property list for websites and apps.
- **Headers:** `Perpage` (default 1), `Inmobiliaria` (0 branch / 1 whole agency), `Ficha` (1 includes sheet).
- **Query:** `page`, `codpro`, `multiple_codpro`, `reference`, `city`, `estate`, `country`, `address`, `zone`, `city_zone`, `biz`, `stratum`, `type`, `neighborhood`, `neighborhood_code`, `area_cons`, `minarea`/`maxarea`, `area_lot`, `minarea_lot`/`maxarea_lot`, `floor_type`, `bedrooms`, `minbed`/`maxbed`, `bathrooms`, `minbath`/`maxbath`, `rent`, `pcmin`/`pcmax`, `saleprice`, `pvmin`/`pvmax`, `administration`, `adminmin`/`adminmax`, `description`, `status`, `nostatus`, `built_year`, `minage`/`maxage`, `great`, `exclusive`, `destination`, `broker`, `branch`, `minparking`/`maxparking`, `minstratum`/`maxstratum`, `minfloor`/`maxfloor`, `minlevel`/`maxlevel`, `amenities`, `amenitiesin`, `update`, `keyword`, `min_street`/`max_street`, `min_avenue`/`max_avenue`. Most non-range codes accept comma-separated multiples.
- **Sort:** `sort=asc|desc` with `order` in `saleprice`, `rent`, `administration`, `address`, `zone`, `city_zone`, `biz`, `stratum`, `type`, `neighborhood`, `neighborhood_code`, `area_cons`, `area_lot`, `floor_type`, `floor`, `bedrooms`, `bathrooms`, `pricemin`, `pricemax`, `consignation_date`.
- **Response:** `{ total, per_page, current_page, last_page, from, to, data[] }` with `idpro`, `codpro`, location, prices, images, status.
- **Pagination:** yes. **Mutates:** no. **Destructive:** no. **Idempotent:** yes.

`0.1.0` shipped a subset of filters plus automatic page following. The
unpublished branch adds the Batch A commercial filters and keeps page
following for every newly mapped query parameter.

#### Search map — `GET /properties/map`

- **Docs:** https://apiv3get.domus.la/docs/3.0/inmuebles/lista-mapa
- **Description:** Lightweight list for map pins; usually paired with detail.
- **Headers:** `Perpage`, `Inmobiliaria`.
- **Query:** same style of geo/inventory filters as the list (page, city, zone, codes, …).
- **Response:** paginated `data[]` with `idpro`, `codpro`, `latitude`, `longitude`.
- **Pagination:** yes. **Mutates:** no.

#### Get property — `GET /properties/{codpro}/{idpro?}`

- **Docs:** https://apiv3get.domus.la/docs/3.0/inmuebles/detalle
- **Headers:** `Inmobiliaria`, `Ficha`, `Mapa` (zoom), `Propietario` (1, permission required).
- **Path:** `codpro` required; `idpro` optional.
- **Response:** `data` object with full sheet, images, 360, tour, agency.
- **Mutates:** no.

#### Portal publications — `GET /properties/portals/{idpro}/{codpro?}`

- **Docs:** https://apiv3get.domus.la/docs/3.0/inmuebles/publicaciones-en-portales
- **Description:** Portals where a property was published, with portal codes and sync dates.
- **Headers:** `Inmobiliaria`.
- **Path:** `idpro` required; `codpro` optional.
- **Response:** array of publication rows (`status`, `portal_name`, `biz`, dates).
- **Mutates:** no.

#### Retry portal publication — `GET /properties/retry-portals/{codpro}/{idpro?}`

- **Docs:** https://apiv3get.domus.la/docs/3.0/inmuebles/reintentar-publicacion-en-portales
- **Description:** Retry a failed create/update/unpublish on portals without editing the property.
- **Query:** `method` = `1` create, `2` update, `3` unpublish.
- **Response:** `{ code, message, property, server_response }`.
- **Mutates:** yes (requeues portal sync). **Idempotent:** not guaranteed. See path note above.

#### Create property — `POST /properties`

- **Docs:** https://apiv3get.domus.la/docs/3.0/inmuebles/creacion
- **Description:** Create a property in the token's agency (other branches allowed, other agencies not).
- **Warning:** created records **cannot be deleted**; only status can change.
- **Body (form):** `codpro` (optional if auto-generated), `city`, `address` or `complete_address`, `latitude`, `longitude`, `zone` or `city_zone`, `populated_center`, `biz`, `stratum`, `type`, `neighborhood` or `neighborhood_code`, areas, rooms, `rent` (required if biz 1 or 3), `saleprice` (required if biz 2 or 3), descriptions, `status`, brokers, `branch`, `amenities`, `amenities_extra` JSON, dates, images `image_#` / `image360_#` (up to 30), and other optional commercial fields. Bold/italic in the docs mark required vs agency-configurable required.
- **Response:** `{ code: 200, message, property: { idpro, codpro, pictures } }`.
- **Mutates:** yes. **Destructive:** no delete path. **Idempotent:** no.

#### Update property — `PUT /properties/{codpro}`

- **Docs:** https://apiv3get.domus.la/docs/3.0/inmuebles/actualizacion
- **Description:** Update fields. Status cannot be changed here.
- **Path:** `codpro` in the URL only, not in the body.
- **Body:** same commercial fields as create; none required. Extra: `image_delete_#`, `image360_delete_#`, `delete_pictures`.
- **Response:** `{ code: 200, message, property }`.
- **Mutates:** yes. **Idempotent:** yes if the same body is replayed.

#### Change status — `PUT /properties/status/{codpro}`

- **Docs:** https://apiv3get.domus.la/docs/3.0/inmuebles/cambio-estado
- **Body:** `status` (required), `description`, `change_date`, `value`, `source`, `broker`, `real_state`.
- **Response:** `{ code: 200, message, property: { idpro, codpro, status, value, description } }`.
- **Mutates:** yes. **Idempotent:** repeating the same status is likely safe; not documented.

#### Status history — `GET /properties/status/{codpro}`

- **Docs:** https://apiv3get.domus.la/docs/3.0/inmuebles/historial-cambio-estado
- **Headers:** `Perpage`.
- **Params:** path `codpro`; `page` (docs list it under form params, example uses query).
- **Response:** nested pagination under `data` with status, profile, agency, source.
- **Pagination:** yes. **Mutates:** no.

#### Separate property — `PUT /properties/detach/{codpro}`

- **Docs:** https://apiv3get.domus.la/docs/3.0/inmuebles/separar
- **Description:** Reserve/separate a property. Must not be done via Change Status.
- **Body:** `status` (separation status), `days`, `comment`, `value`.
- **Response:** `{ code, message, data: { code, property_code, status, comment, value, active } }`.
- **Mutates:** yes.

### Consultas de búsqueda

All `/search/*` methods: header `Inmobiliaria`; response `{ data: [{ code, name, ... }] }`;
no pagination in the examples. They only return values that already have properties
in the current agency/branch. Query filters mirror property-list facets so dropdowns
can stay consistent with the current search.

| Endpoint | Docs | Extra notes |
| -------- | ---- | ----------- |
| `GET /search/biz` | [gestiones](https://apiv3get.domus.la/docs/3.0/busqueda/gestiones) | Business types with inventory |
| `GET /search/types` | [tipos](https://apiv3get.domus.la/docs/3.0/busqueda/tipos_inmueble) | Property types with inventory |
| `GET /search/cities` | [ciudades](https://apiv3get.domus.la/docs/3.0/busqueda/ciudades) | Includes `state_code`, lat/long |
| `GET /search/zones` | [zonas](https://apiv3get.domus.la/docs/3.0/busqueda/zonas) | Scope with `city` when possible |
| `GET /search/neighborhoods` | [barrios](https://apiv3get.domus.la/docs/3.0/busqueda/barrios) | Scope with `city` |
| `GET /search/digited-neighborhoods` | [barrios digitados](https://apiv3get.domus.la/docs/3.0/busqueda/barrios-digitados) | Neighborhoods typed by users, not only catalog |

**Mutates:** no. Inventory search locators shipped in `0.1.0`. Typed
neighborhoods are wired as a helper on this branch; Domus returns `name`
without `code`, so the locator value is the neighborhood name.

### Consultas generales

Full catalogs, not limited to current inventory. Header `Authorization` only
unless a page adds query filters (`populated-centers` documents `?city`).
Typical response `{ data: [{ code, name }] }`. Sort via `order` + `sort`.

| Endpoint | Purpose |
| -------- | ------- |
| `GET /general/biz` | All business types |
| `GET /general/types` | All property types |
| `GET /general/countries` | Countries; used for credential test |
| `GET /general/states` | Departments |
| `GET /general/cities` | All cities |
| `GET /general/zones` | All zones |
| `GET /general/city-zones` | Zones by city |
| `GET /general/populated-centers` | Populated centers; `city` query |
| `GET /general/neighborhoods` | All neighborhoods |
| `GET /general/amenities` | Features |
| `GET /general/amenities-extra` | Extra features |
| `GET /general/destinations` | Destinations |
| `GET /general/status` | Property statuses (e.g. Disponible) |
| `GET /general/detach/status` | Separation statuses |
| `GET /general/phone-types` | Owner phone types |
| `GET /general/tags` | Tags |

**Mutates:** no.

### Administrativo

#### List advisors — `GET /administrative/brokers`

- **Docs:** https://apiv3get.domus.la/docs/3.0/administrativo/asesores
- **Headers:** `Inmobiliaria`.
- **Response:** `{ data: [{ code, id_number, name, last_name, phones, email, picture, biz_code, ... }] }`.
- **Mutates:** no.

#### Create advisor — `POST /administrative/brokers`

- **Body:** `name`, `last_name`, `document`, `verification_digit`, `phone` or `mobile_phone`, `address`, `email`, `alternative_email`, `picture_url`, `order`, `department`, `description`, `mls_biz`.
- **Response:** `{ code: 200, message, broker }`.
- **Mutates:** yes.

#### Update advisor — `PUT /administrative/brokers/{code}`

- **Path:** advisor `code`.
- **Body:** same fields as create (form).
- **Mutates:** yes. **Idempotent:** yes for identical body.

#### Branches — `GET /administrative/branches`

- Agency/branch directory for the token.
- **Mutates:** no.

#### Sources — `GET /administrative/sources`

- Provenances used when changing property status (`source`).
- **Mutates:** no. Helper for Change Status.

#### Document types — `GET /administrative/document_types`

- **Docs:** https://apiv3get.domus.la/docs/3.0/administrativo/tipos_documento
- Identification document types for owner `document_type`. The page is live and linked from owner creation, but it is missing from the documentation sidebar.
- **Mutates:** no. Helper for Owner Create and Update.

#### Partners — `GET /administrative/partners`

- Real-estate allies. **Mutates:** no. Deferred.

### Propietarios

#### Search owners — `GET /owners`

- **Docs:** https://apiv3get.domus.la/docs/3.0/propietarios/lista
- **Headers:** `Perpage` (default 12), `Inmobiliaria`.
- **Query:** `branch`, `city`, `name`, `phone`, `precise_phone`, `email`, `document`, `codpro`, `has_properties`, `has_email`. The parameter table spells the exact-phone filter `preicse_phone` while its own example sends `precise_phone`; the node sends `precise_phone`.
- **Sort:** `name`, `last_name`, `code`.
- **Response:** paginated `data[]` with document, contact, phones.
- **Pagination:** yes. **Mutates:** no.

#### Get owner — `GET /owners/{document}`

- **Docs:** https://apiv3get.domus.la/docs/3.0/propietarios/detalle
- **Path:** identification document; send `0` if unknown.
- **Query:** `code` if document is missing; `property_status_code`.
- **Headers:** `Inmobiliaria`.
- **Response:** `data` with phones and associated `properties[]`.
- **Mutates:** no.

#### Create owner — `POST /owners`

- **Docs:** https://apiv3get.domus.la/docs/3.0/propietarios/creacion
- **Required:** `name`, `last_name`, `document`.
- **Body:** the required fields plus `email`, `document_type`, `verification_digit`, `branch`, `city`, `birthday`, `neighborhood`, `description`, `property`, `share_percentage`, `phones`.
- **Phones:** JSON string in a form field, `[{"type":"1","number":"12356"}]`. Types come from `/general/phone-types`.
- **Can associate a property at creation** through `property` and `share_percentage`.
- **Response:** `{ code: 200, message, property: { code, document, property_code } }`. Domus names the envelope `property` even for owners.
- **Mutates:** yes.

#### Update owner — `PUT /owners/{document}`

- **Docs:** https://apiv3get.domus.la/docs/3.0/propietarios/actualizacion
- **Path:** the page text says the number in the URL is the owner document, while the example reads `/owners/123456`, which looks like a code. The node sends the document, matching Get.
- **Headers:** `Inmobiliaria`.
- **Body:** every create field, all optional, and `document` itself can be rewritten.
- **Phones:** same JSON field. Update also accepts `{"oldType","oldNumber","newType","newNumber"}` and `{"oldType","oldNumber","delete":"1"}` entries, and `phones_recursive=1` to send the list in the same shape as creation. The node implements the creation shape with `phones_recursive`; per-entry editing is not exposed.
- **Response:** `{ code: 200, message, property: { code, document, sent_property_code } }`.
- **Mutates:** yes.

#### Unlink owner — `DELETE /owners/{owner_code}/{codpro}`

- **Description:** Remove the owner–property association. Does not say the owner record is deleted.
- **Headers:** `Inmobiliaria`.
- **Mutates:** yes. **Destructive:** association only. **Idempotent:** second call likely errors.

### Proyectos

#### MLS list/detail — `GET /projects`, `GET /projects/{code}/{unique_code?}`

- **Docs:** [lista](https://apiv3get.domus.la/docs/3.0/proyectos/lista), [detalle](https://apiv3get.domus.la/docs/3.0/proyectos/detalle)
- **Note:** MLS inventory, not CRM V2.
- **Headers:** `Perpage`, `Inmobiliaria`.
- **Pagination:** list yes. **Mutates:** no.

#### CRM V2 list — `GET /projects-v2`

- **Docs:** https://apiv3get.domus.la/docs/3.0/proyectos-v2/lista
- **Headers:** `Perpage`.
- **Query:** `page`, `city`, `country`, `branch`, `neighborhood`, `name`, `code`, `status`, `nostatus`.
- **Response:** `{ code, message, total, per_page, current_page, last_page, data[] }` with prices, pictures, branch, agency.
- **Pagination:** yes. **Mutates:** no.

#### CRM V2 detail — `GET /projects-v2/{code}?unique_code=`

- **Docs:** https://apiv3get.domus.la/docs/3.0/proyectos-v2/detalle
- **Mutates:** no.

### Captaciones V2

#### List — `GET /captures-v2`

- **Docs:** https://apiv3get.domus.la/docs/3.0/captaciones-v2/lista
- **Headers:** `Perpage`.
- **Query:** `page`, `city`, `branch`, `neighborhood`, `biz`, `stratum`, `type`, area/price/admin ranges, rooms, `broker`, `contact`.
- **Response:** paginated captures with property snapshot, CRM contact, broker, branch.
- **Pagination:** yes. **Mutates:** no.

#### Detail — `GET /captures-v2/{code}?unique_code=`

- **Docs:** https://apiv3get.domus.la/docs/3.0/captaciones-v2/detalle
- **Mutates:** no.

No create/update capture endpoints are documented.

## Current node vs API

Published `0.1.0` public surface:

```text
Domus
└── Property
    ├── Search    GET /properties          (subset of filters)
    └── Get       GET /properties/{codpro}/{idpro?}
```

Unpublished branches (batches A and B complete):

```text
Domus
├── Property
│   ├── Search              GET /properties          (core commercial filters)
│   ├── Get                 GET /properties/{codpro}/{idpro?}
│   ├── Create              POST /properties
│   ├── Update              PUT /properties/{codpro}
│   ├── Get Status History  GET /properties/status/{codpro}
│   ├── Change Status       PUT /properties/status/{codpro}
│   ├── Get Portal Publications   GET /properties/portals/{idpro}/{codpro?}
│   └── Retry Portal Publication  GET /properties/retry-portals/{codpro}/{idpro?}
└── Owner
    ├── Search              GET /owners
    ├── Get                 GET /owners/{document}
    ├── Create              POST /owners
    └── Update              PUT /owners/{document}
```

Helpers already wired:

```text
/search/cities
/search/types
/search/biz
/search/zones
/search/neighborhoods
/search/digited-neighborhoods   (helper; names only, no codes)
/general/countries              (credential test only)
/general/status                 (Search + Change Status + Create locator)
/general/amenities              (Search and write locator; scoped by property type)
/general/city-zones             (Search and write locator; scoped by city)
/general/cities                 (Create/Update city locator)
/general/types                  (Create/Update property-type locator)
/general/biz                    (Create/Update business-type locator)
/general/zones                  (Create/Update cardinal-zone locator)
/general/neighborhoods          (Create/Update neighborhood locator; city + name)
/administrative/sources         (Change Status locator)
/administrative/brokers         (broker, catcher_broker, and promoter_broker locator)
/administrative/branches        (branch locator)
/administrative/document_types  (Owner document-type locator)
/general/phone-types            (Owner phone-type dropdown)
```

Search covers the Batch A commercial filters. Create and Update send the
documented commercial form fields. Still omitted on write: image_# /
image360_#, image delete indexes, amenities_extra JSON, multilingual
descriptions, and populated-center / destination locators.

Owner Create and Update send every documented form field. Still omitted:
per-entry phone editing through the `oldType` / `newType` / `delete` grammar,
which only Update accepts.

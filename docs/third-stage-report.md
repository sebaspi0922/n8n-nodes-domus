# Third-stage report

- Closed: August 27, 2026
- Status: `1.0.0` development scope complete, publish pending review closure
- Scope: batches A through D of the `1.0.0` roadmap

## Outcome

Every public operation the roadmap targets at `1.0.0` is implemented on git and
covered by automated tests. The node grew from the two read operations in
published `0.1.0` to seventeen operations across five resources, and the
selector layer grew from five inventory-search endpoints to fifteen catalogs.

Nothing further is planned for `1.0.0`. Publishing is gated on the `0.1.0`
Creator Portal review closing, not on additional development.

## Public surface at 1.0.0

| Resource | Operations |
| -------- | ---------- |
| Property | Search, Get, Create, Update, Get Status History, Change Status, Get Portal Publications, Retry Portal Publication |
| Owner | Search, Get, Create, Update |
| Advisor | Search |
| Project | Search, Get |
| Acquisition | Search, Get |

Five resources, seventeen operations, all against Domus API 3.0.

## What each batch delivered

**A — Property writes and status.** The commercial search filters (price, room
and area ranges, amenities, status, broker, branch, dates, sort), Change
Status, Get Status History, Create, and Update. Image upload, the
extra-amenities JSON field, and multilingual descriptions were deliberately
left out.

**B — Owners and portals.** The whole Owner resource, with phones serialized
into the JSON array Domus documents and phone-type and document-type catalogs
behind selectors. Property gained the two portal operations. Domus documents
the retry endpoint under a badge path that collides with the publications
endpoint, so the node follows the request example at `/properties/retry-portals`
instead.

**C — People and projects.** Advisor as a readable resource rather than only a
locator, and the Domus V2 Project list and detail. MLS v1 projects stay out
because Domus states they are different inventory.

**D — CRM intake.** Acquisition search and detail over captures V2, read-only
because Domus documents no capture writes and API 3.0 has no separate leads or
contacts module.

## Deliberate exclusions

These are not gaps to fix before publishing; each has a later target.

| Excluded | Target |
| -------- | ------ |
| Property Search Map, Separate, Owner Unlink, separation-status helper | 1.1.0 |
| Advisor Create/Update, Branch as a resource | 1.2.0 |
| Department, populated-center, extra-amenities, and destination locators | 1.3.0 |
| MLS v1 projects, real-estate partners, tags | none |

Property image upload, `amenities_extra` JSON, and multilingual descriptions
also remain out of scope; they need a file-handling design rather than another
form field.

## Quality checks

Each batch landed as its own pull request with CI green on lint, build, unit
tests, and `npm pack` validation. The unit suite grew from 64 to 89 checks over
these batches, asserting endpoint routing, header and query mapping, pagination
envelopes, output unwrapping, resource isolation between parameters that share
a name, and that every packaged example workflow stays sanitized and points at
a real operation.

```bash
npm run lint
npm run build
npm test
npm pack --dry-run --json
```

Contract tests against `newapi.domus.la` cover the new read endpoints and skip
themselves without `DOMUS_TEST_TOKEN`. Retry Portal Publication has no
automatic contract test on purpose: it queues a real portal transaction and is
not idempotent.

## Known local caveat

`npm run lint` fails with eight false `no-restricted-imports` errors when the
repository is checked out one directory below the filesystem root, such as
`/workspace`. The n8n community-nodes rule walks up for `package.json` to read
`devDependencies` and stops one level short at that depth, so it cannot see
that `@playwright/test` is a dev dependency. CI and any normal checkout are
unaffected. Linting from a deeper path clears it.

## Security

No Domus token, response fixture, trace, or screenshot from live testing is
stored in this repository or its history. The token is entered only through the
n8n credential interface, which stores it encrypted and injects it into
requests.

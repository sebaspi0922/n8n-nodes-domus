# Second-stage report

- Closed: August 20, 2026
- Status: completed
- Scope: packed-node installation in clean Docker n8n and `Property → Get`

## Outcome

The packed `n8n-nodes-domus` package was installed in a separate clean n8n
2.35.5 Docker instance. n8n loaded the Domus node and credential without a
development link. The new property detail operation was then tested with a
real Domus credential.

## Clean package installation

The integration flow was:

```text
source → build → npm pack → clean n8n Docker volume → npm install .tgz → n8n
```

The automated Docker check confirmed:

- package installation under `/home/node/.n8n/nodes`
- `n8n-nodes-domus.domus` loaded successfully
- `domusApi` credential registered
- `search` and `get` operations registered
- no Domus package-loading error in the n8n logs

The final tested archive was `n8n-nodes-domus-0.1.0.tgz`, containing only the
compiled node, credential, resources, icons, package metadata, README, and MIT
license required for distribution.

## Property detail operation

- Operation: `Property → Get`
- Method and endpoint: `GET /properties/{codpro}/{idpro?}`
- Required identifier: property code (`codpro`)
- Optional identifier: internal property ID (`idpro`)
- Output: the Domus response `data` object as one direct n8n item

Supported headers include the whole-agency scope, property sheet, map zoom,
and owner information where the credential has sufficient permissions.

## Live verification

Manual testing with a real credential confirmed:

- get a real property by code
- get the same property with its optional internal ID
- include or omit the property sheet
- whole-agency access enabled and disabled
- property-not-found response propagated as HTTP `404` with `Property not found`
- invalid credential rejected by the n8n credential test
- refused network connection propagated as an execution error
- dynamic filters for property type, business type, zone, and neighborhood
- manual neighborhood code `43` returned the same three records as the dynamic selector

The real token was never added to Docker Compose, scripts, fixtures, logs,
screenshots stored in the repository, or Git history. The disposable Docker
volume was removed after testing.

## Quality checks

The completed stage passed:

```bash
npm run lint
npm run build
npm test
npm pack --dry-run --json
npm run test:docker
```

`n8n-nodes-domus@0.1.0` was subsequently published to npm with provenance and
submitted to the n8n Creator Portal, where it is in Manual Review.

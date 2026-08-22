# n8n community node

## Overview
This is a project containing code for an n8n community node. n8n is a workflow
automation platform where users build workflows with nodes, which are the
building block of a workflow. Nodes can perform a range of actions, such as
starting a workflow (called a "trigger node"), fetching and sending data, or
processing and manipulating it. Besides that there are credentials - entities
that store sensitive information on how to connect to external services and
APIs. A node can require some credentials to be used. Community nodes are a way
for anyone to create such nodes and add them to be used in n8n. All community
nodes are named in a format: `n8n-nodes-<n>` or `@org/n8n-nodes-<n>`.
Community nodes can also be submitted for approval to be used on n8n Cloud
version. In that case there are rules that the node needs to follow in order to
be approved

## Important notes
- Follow the **rules and guidelines in this document and the linked docs
  below** over any code examples.
- All code blocks in these docs are **illustrative and incomplete**.
  They **MUST NOT** be copied verbatim or assumed to be the final desired code.
- Replace example names like `Example`, `Wordpress`, `wordpressApi`, etc.
  with names that match the **actual service / node** you are building.
- When in doubt, **generalize from the patterns**, don't replicate the exact
  structure, fields, or values from the examples.
- Produce the **full implementation** needed for the current project
  (nodes, credentials, tests, etc.), not just fragments similar to examples.
- If an example omits parts (e.g. types, operations, properties), **infer and
  implement the missing parts** based on the real requirements / API docs.
- Never output `Wordpress`-specific code unless the project is actually about
  WordPress.

## Project structure
There are two main folders in this project:
- `nodes` contains all of the nodes in a package (there can be more than 1).
  The code for each node usually lives in its own folder
- `credentials` contains all of the credentials in a package. Usually it's just
  a single file for every credential
So it looks something like this:
.
├── nodes/
│   └── Example/
│       ├── Example.node.ts
│       └── ...
├── credentials/
│   └── Example.credentials.ts
├── package.json
└── ...
It's important to note that `package.json` has a special field `n8n` that have
information about nodes and credentials in a package:
```json
{
  "name": "n8n-nodes-example",
  "version": "1.0.0",
  "n8n": {
    "n8nNodesApiVersion": 1,
    "strict": true,
    "credentials": [
        "dist/credentials/Example.credentials.js"
    ],
    "nodes": [
      "dist/nodes/Example/Example.node.js"
    ]
  }
}
```
`nodes` and `credentials` keys contain paths to transpiled JS files in a `dist`
folder for the nodes and credentials respectively. If you add/remove/rename
nodes and/or credentials, you need to make sure to update `n8n.nodes` and
`n8n.credentials` keys in `package.json` accordingly. Initial files in the
project _may_ contain example nodes and/or credentials that need to be
**removed or renamed** once you start making an actual node.

## Key guidelines
- Use the `n8n-node` CLI tool **whenever possible** for building, dev mode,
  linting, etc.
- **Always** address any lint/typecheck errors/warnings, unless there is a
  **very specific reason** to ignore/disable it
- Make sure to use **proper types whenever possible**
- If you are updating the npm package version, make sure to **update
  CHANGELOG.md** in the root of the repository
- Read `.agents/workflow.md` for more info

## Context-specific docs
Load these before working on the relevant area:

| Working on...                        | Read first                                                          |
|--------------------------------------|---------------------------------------------------------------------|
| Any node file in `nodes/`            | `.agents/nodes.md` and `.agents/properties.md`                      |
| A declarative-style node             | above + `.agents/nodes-declarative.md`                              |
| A programmatic-style node            | above + `.agents/nodes-programmatic.md`                             |
| Files in `credentials/`              | `.agents/credentials.md`                                            |
| Adding a new version to a node       | `.agents/versioning.md`                                             |
| Starting a new task or planning      | `.agents/workflow.md`                                               |

## Additional resources
If you need any extra information, here are links to n8n's official docs
regarding building community nodes:
- https://docs.n8n.io/integrations/community-nodes/build-community-nodes/
- https://docs.n8n.io/integrations/creating-nodes/overview/
- https://docs.n8n.io/integrations/creating-nodes/build/reference/
- https://docs.n8n.io/integrations/creating-nodes/build/reference/ux-guidelines/

## Cursor Cloud specific instructions

- **Node.js version**: the package requires Node `>=22.22.0 <26` and pins
  `24.19.0` in `.node-version`. The VM's default `node` (from `/exec-daemon`)
  is 22.x, which is below the minimum, so the environment installs Node
  24.19.0 via `nvm` and makes it win in every shell (symlinks in
  `/usr/local/cargo/bin`, the first `PATH` entry, plus a `~/.bashrc` prepend).
  This is baked into the snapshot, so `node --version` should already report
  `v24.19.0`. If it ever reports 22.x, run `nvm use 24.19.0`.
- **Standard commands** live in `package.json` scripts: `npm run lint`,
  `npm run build`, `npm test` (build + `node --test`), and `npm run dev`.
  Prefer the `n8n-node` CLI wrappers already wired there.
- **Running the app**: `npm run dev` (`n8n-node dev`) compiles the node, links
  it into `~/.n8n-node-cli/.n8n/custom`, and starts n8n with hot reload at
  http://localhost:5678. The **first** run downloads n8n into
  `~/.n8n-node-cli` and takes ~1-2 minutes before the editor answers; poll
  `http://localhost:5678/healthz` until it returns `{"status":"ok"}`. n8n's
  first launch requires creating an owner account in the browser UI. The
  unrelated `n8n-nodes-base.confluence` and Python task-runner warnings in the
  dev log are n8n internals and can be ignored.
- **Executing the Domus node** against the real API needs a valid Domus token,
  which must never be committed (see `README.md`). Without a real token, node
  execution and the credential test fail with an auth/`404` error from the live
  Domus API — that failure still proves the node builds and sends real HTTP
  requests end-to-end.
- **Docker integration test** (`npm run test:docker`, port `5680`) needs Docker,
  which is not installed by default; it is optional and separate from the
  `npm run dev` instance.

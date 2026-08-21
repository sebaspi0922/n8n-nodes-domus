#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="${repo_root}/docker/compose.yaml"
artifact_dir="${repo_root}/artifacts"
package_name="$(node -p "require('${repo_root}/package.json').name")"
package_version="$(node -p "require('${repo_root}/package.json').version")"
package_file="${package_name}-${package_version}.tgz"

export DOMUS_PACKAGE_FILE="${package_file}"

mkdir -p "${artifact_dir}"

cd "${repo_root}"
npm run build
npm pack --pack-destination "${artifact_dir}"

docker compose --file "${compose_file}" down --volumes --remove-orphans
docker compose --file "${compose_file}" run --rm package-installer
docker compose --file "${compose_file}" up --detach n8n

healthy=false
for _ in $(seq 1 60); do
	if curl --fail --silent http://127.0.0.1:5680/healthz >/dev/null; then
		healthy=true
		break
	fi
	sleep 1
done

if [[ "${healthy}" != "true" ]]; then
	docker compose --file "${compose_file}" logs --no-color n8n
	echo "n8n did not become healthy on http://127.0.0.1:5680" >&2
	exit 1
fi

docker compose --file "${compose_file}" exec --no-TTY n8n \
	n8n export:nodes --output=/tmp/n8n-domus-nodes.json

docker compose --file "${compose_file}" exec --no-TTY n8n node -e '
const nodes = require("/tmp/n8n-domus-nodes.json");
const domus = nodes.find((node) => node.name === "n8n-nodes-domus.domus");
if (!domus) throw new Error("The Domus node was not loaded by n8n");
if (!domus.credentials?.some((credential) => credential.name === "domusApi")) {
	throw new Error("The Domus API credential was not registered");
}
const operations = domus.properties
	.find((property) => property.name === "operation")
	?.options ?? [];
for (const operationName of ["search", "get"]) {
	if (!operations.some((operation) => operation.value === operationName)) {
		throw new Error(`Property operation ${operationName} was not registered`);
	}
}
console.log(`Loaded ${domus.name} with credential domusApi and operations search/get`);
'

docker compose --file "${compose_file}" exec --no-TTY n8n \
	n8n import:workflow \
	--input="/home/node/.n8n/nodes/node_modules/${package_name}/examples/search-properties.json"

logs="$(docker compose --file "${compose_file}" logs --no-color n8n)"
if grep --extended-regexp --ignore-case --quiet \
	'error loading package.*n8n-nodes-domus|failed to load.*domus' <<<"${logs}"; then
	echo "n8n reported an error while loading n8n-nodes-domus" >&2
	echo "${logs}" >&2
	exit 1
fi

echo "Docker integration test passed, including the packaged example workflow."
echo "n8n is running at http://localhost:5680"
echo "Run 'npm run docker:down' to stop it and remove its disposable data."

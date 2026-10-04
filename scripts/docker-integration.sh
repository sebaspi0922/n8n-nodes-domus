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

ready=false
for _ in $(seq 1 90); do
	if docker compose --file "${compose_file}" logs --no-color n8n | grep -q 'Editor is now accessible'; then
		ready=true
		break
	fi
	sleep 1
done

if [[ "${ready}" != "true" ]]; then
	docker compose --file "${compose_file}" logs --no-color n8n
	echo "n8n became healthy but the editor never reported ready" >&2
	exit 1
fi

docker compose --file "${compose_file}" exec --no-TTY n8n \
	n8n export:nodes --output=/tmp/n8n-domus-nodes.json

docker compose --file "${compose_file}" exec --no-TTY n8n node -e '
const nodes = require("/tmp/n8n-domus-nodes.json");
// Domus is a single node type with version [1, 2], so n8n exports one entry for
// it. n8n appends a Custom API Call option to every resource and operation list,
// so that value is ignored below.
const CUSTOM_API_CALL = "__CUSTOM_API_CALL__";
const entries = nodes.filter((node) => node.name === "n8n-nodes-domus.domus");
if (entries.length !== 1) {
	throw new Error(`Expected one n8n-nodes-domus.domus entry, found ${entries.length}`);
}
const domus = entries[0];
const loadedVersions = [domus.version].flat();
if (!loadedVersions.includes(1) || !loadedVersions.includes(2)) {
	throw new Error(`Domus node versions 1 and 2 were not both loaded by n8n (found ${loadedVersions.join(", ")})`);
}
if (nodes.some((node) => node.name === "n8n-nodes-domus.domusCrm")) {
	throw new Error("The separate Domus CRM node is still registered");
}
function optionValues(property) {
	return (property?.options ?? [])
		.map((option) => option.value)
		.filter((value) => value !== CUSTOM_API_CALL);
}
function operationsFor(node, resource) {
	return optionValues(node.properties.find((property) =>
		property.name === "operation" && property.displayOptions?.show?.resource?.includes(resource),
	));
}
function check(node, credentials, expected) {
	const label = `Domus v${loadedVersions.join(", v")}`;
	for (const name of credentials) {
		if (!node.credentials?.some((credential) => credential.name === name)) {
			throw new Error(`${label}: credential ${name} was not registered`);
		}
	}
	const resources = optionValues(node.properties.find((property) => property.name === "resource"));
	let operationCount = 0;
	for (const [resource, names] of Object.entries(expected)) {
		if (!resources.includes(resource)) {
			throw new Error(`${label}: resource ${resource} was not registered`);
		}
		const registered = operationsFor(node, resource);
		for (const name of names) {
			if (!registered.includes(name)) {
				throw new Error(`${label}: ${resource} operation ${name} was not registered`);
			}
		}
		operationCount += names.length;
	}
	console.log(`Loaded n8n-nodes-domus.domus (${label}) with ${resources.length} resources and ${operationCount} operations`);
}
const apiExpected = {
	property: ["search", "searchMap", "get", "create", "update", "getStatusHistory", "getPortalPublications", "retryPortalPublication", "changeStatus", "separate"],
	owner: ["search", "get", "create", "update", "unlink"],
	advisor: ["search", "create", "update"],
	branch: ["search"],
	project: ["search", "get"],
	acquisition: ["search", "get"],
};
const crmExpected = {
	meeting: ["search", "get", "create", "update", "confirm"],
	opportunity: ["search", "get", "create"],
	profile: ["search"],
	contact: ["search", "get", "create", "update"],
};
check(domus, ["domusApi", "domusCrmApi"], { ...apiExpected, ...crmExpected });
const profileOperations = operationsFor(domus, "profile");
if (profileOperations.length !== 1) {
	throw new Error(`Domus: profile should only offer search, found ${profileOperations.join(", ")}`);
}
'

docker compose --file "${compose_file}" exec --no-TTY n8n sh -c \
	"for f in /home/node/.n8n/nodes/node_modules/${package_name}/examples/*.json; do n8n import:workflow --input=\"\$f\"; done"

logs="$(docker compose --file "${compose_file}" logs --no-color n8n)"
if grep --extended-regexp --ignore-case --quiet \
	'error loading package.*n8n-nodes-domus|failed to load.*domus' <<<"${logs}"; then
	echo "n8n reported an error while loading n8n-nodes-domus" >&2
	echo "${logs}" >&2
	exit 1
fi

echo "Docker integration test passed, including the packaged example workflows."
echo "n8n is running at http://localhost:5680"
echo "Run 'npm run docker:down' to stop it and remove its disposable data."

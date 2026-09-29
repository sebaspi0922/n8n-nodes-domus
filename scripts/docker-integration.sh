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
const domus = nodes.find((node) => node.name === "n8n-nodes-domus.domus");
if (!domus) throw new Error("The Domus node was not loaded by n8n");
if (!domus.credentials?.some((credential) => credential.name === "domusApi")) {
	throw new Error("The Domus API credential was not registered");
}
const expected = {
	property: ["search", "searchMap", "get", "create", "update", "getStatusHistory", "getPortalPublications", "retryPortalPublication", "changeStatus", "separate"],
	owner: ["search", "get", "create", "update", "unlink"],
	advisor: ["search", "create", "update"],
	branch: ["search"],
	project: ["search", "get"],
	acquisition: ["search", "get"],
};
const resources = (domus.properties.find((property) => property.name === "resource")?.options ?? [])
	.map((option) => option.value);
for (const resource of Object.keys(expected)) {
	if (!resources.includes(resource)) {
		throw new Error(`Resource ${resource} was not registered`);
	}
}
const operationProperties = domus.properties.filter((property) => property.name === "operation");
function operationsFor(resource) {
	const property = operationProperties.find((candidate) =>
		candidate.displayOptions?.show?.resource?.includes(resource),
	);
	return (property?.options ?? []).map((option) => option.value);
}
for (const [resource, names] of Object.entries(expected)) {
	const registered = operationsFor(resource);
	for (const name of names) {
		if (!registered.includes(name)) {
			throw new Error(`${resource} operation ${name} was not registered`);
		}
	}
}
console.log("Loaded n8n-nodes-domus.domus with 6 resources and 23 operations");

const crm = nodes.find((node) => node.name === "n8n-nodes-domus.domusCrm");
if (!crm) throw new Error("The Domus CRM node was not loaded by n8n");
if (!crm.credentials?.some((credential) => credential.name === "domusCrmApi")) {
	throw new Error("The Domus CRM API credential was not registered");
}
const crmResources = (crm.properties.find((property) => property.name === "resource")?.options ?? [])
	.map((option) => option.value);
if (!crmResources.includes("meeting")) {
	throw new Error("The Meeting resource was not registered");
}
if (!crmResources.includes("opportunity")) {
	throw new Error("The Opportunity resource was not registered");
}
if (!crmResources.includes("profile")) {
	throw new Error("The Profile resource was not registered");
}
const crmOperationProperty = crm.properties.find((property) =>
	property.name === "operation" && property.displayOptions?.show?.resource?.includes("meeting"),
);
const crmOperations = (crmOperationProperty?.options ?? []).map((option) => option.value);
for (const name of ["search", "get", "create", "update", "confirm"]) {
	if (!crmOperations.includes(name)) {
		throw new Error(`meeting operation ${name} was not registered`);
	}
}
const opportunityOperationProperty = crm.properties.find((property) =>
	property.name === "operation" && property.displayOptions?.show?.resource?.includes("opportunity"),
);
const opportunityOperations = (opportunityOperationProperty?.options ?? []).map((option) => option.value);
for (const name of ["search", "get", "create"]) {
	if (!opportunityOperations.includes(name)) {
		throw new Error(`opportunity operation ${name} was not registered`);
	}
}
const profileOperationProperty = crm.properties.find((property) =>
	property.name === "operation" && property.displayOptions?.show?.resource?.includes("profile"),
);
const profileOperations = (profileOperationProperty?.options ?? []).map((option) => option.value);
if (!profileOperations.includes("search")) {
	throw new Error("profile operation search was not registered");
}
for (const name of profileOperations) {
	if (name !== "search") {
		throw new Error(`profile operation ${name} was not requested`);
	}
}
if (!crmResources.includes("contact")) {
	throw new Error("The Contact resource was not registered");
}
const contactOperationProperty = crm.properties.find((property) =>
	property.name === "operation" && property.displayOptions?.show?.resource?.includes("contact"),
);
const contactOperations = (contactOperationProperty?.options ?? []).map((option) => option.value);
for (const name of ["search", "get", "create", "update"]) {
	if (!contactOperations.includes(name)) {
		throw new Error(`contact operation ${name} was not registered`);
	}
}
console.log("Loaded n8n-nodes-domus.domusCrm with Meeting search, get, create, update, and confirm, Opportunity search, get, and create, Profile search, and Contact search, get, create, and update");
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

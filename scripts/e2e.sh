#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
n8n_url="${N8N_BASE_URL:-http://127.0.0.1:5680}"

cd "${repo_root}"

if [[ -f "${repo_root}/.env" ]]; then
	set -a
	# shellcheck disable=SC1091
	source "${repo_root}/.env"
	set +a
	n8n_url="${N8N_BASE_URL:-${n8n_url}}"
fi

if ! curl --fail --silent "${n8n_url}/healthz" >/dev/null; then
	echo "n8n is not healthy at ${n8n_url}; running the Docker integration bootstrap."
	bash "${repo_root}/scripts/docker-integration.sh"
fi

playwright_args=()
if [[ "${PLAYWRIGHT_HEADED:-0}" == "1" ]]; then
	playwright_args+=(--headed)
fi

npx playwright test "${playwright_args[@]}" "$@"

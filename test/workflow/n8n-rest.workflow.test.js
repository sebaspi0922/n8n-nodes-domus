const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { getDomusTestConfig, getN8nTestConfig } = require('../helpers/env');
const { createN8nClient, ensureOwnerSession } = require('../helpers/n8n-rest');

const loadExample = (fileName) =>
	JSON.parse(readFileSync(resolve(__dirname, '../../examples', fileName), 'utf8'));

const unwrap = (payload) => payload?.data ?? payload;

describe('n8n REST workflow execution', () => {
	it('imports the packaged Search example and returns property items', async (t) => {
		const domus = getDomusTestConfig();
		const n8n = getN8nTestConfig();
		const client = createN8nClient(n8n.baseURL);

		if (!(await client.isHealthy())) {
			t.skip(`n8n is not reachable at ${n8n.baseURL}; run npm run test:docker first`);
			return;
		}

		if (!domus.hasToken) {
			t.skip('Set DOMUS_TEST_TOKEN to execute packaged workflows against Domus');
			return;
		}

		await ensureOwnerSession(client, n8n);

		const credential = await client.request('/rest/credentials', {
			method: 'POST',
			body: {
				name: `Domus workflow ${Date.now()}`,
				type: 'domusApi',
				data: {
					token: domus.token,
					environment: 'https://newapi.domus.la',
				},
			},
		});
		assert.ok(credential.ok, `Creating the Domus credential failed with HTTP ${credential.status}`);
		const credentialId = unwrap(credential.data)?.id;
		assert.ok(credentialId);

		const workflowTemplate = loadExample('search-properties.json');
		const [domusNode] = workflowTemplate.nodes.filter((node) => node.type === 'n8n-nodes-domus.domus');
		domusNode.credentials = {
			domusApi: {
				id: String(credentialId),
				name: 'Domus API',
			},
		};

		const created = await client.request('/rest/workflows', {
			method: 'POST',
			body: {
				name: `Domus search workflow ${Date.now()}`,
				nodes: workflowTemplate.nodes,
				connections: workflowTemplate.connections,
				settings: workflowTemplate.settings ?? { executionOrder: 'v1' },
			},
		});
		assert.ok(created.ok, `Creating the workflow failed with HTTP ${created.status}`);
		const workflow = unwrap(created.data);
		assert.ok(workflow?.id);

		const run = await client.request(`/rest/workflows/${workflow.id}/run`, {
			method: 'POST',
			body: {
				destinationNode: {
					nodeName: domusNode.name,
					mode: 'inclusive',
				},
			},
		});
		assert.ok(run.ok, `Workflow run failed with HTTP ${run.status}`);

		const executionId = unwrap(run.data)?.executionId ?? unwrap(run.data)?.id;
		assert.ok(executionId);

		let execution;
		for (let attempt = 0; attempt < 30; attempt += 1) {
			const current = await client.request(`/rest/executions/${executionId}`);
			execution = unwrap(current.data);
			if (execution?.status && execution.status !== 'running' && execution.status !== 'new') {
				break;
			}
			await new Promise((resolveWait) => setTimeout(resolveWait, 500));
		}

		assert.ok(execution, 'n8n did not return an execution');
		assert.notEqual(execution.status, 'error');
	});
});

const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { describe, it } = require('node:test');
const { join } = require('node:path');

const examplesDir = join(__dirname, '../examples');

describe('packaged example workflows', () => {
	const files = readdirSync(examplesDir).filter((name) => name.endsWith('.json'));

	const operationsByResource = {
		acquisition: ['search', 'get'],
		advisor: ['search'],
		owner: ['search', 'get', 'create', 'update'],
		project: ['search', 'get'],
		property: [
			'search',
			'get',
			'create',
			'update',
			'getStatusHistory',
			'changeStatus',
			'getPortalPublications',
			'retryPortalPublication',
		],
	};

	it('ships sanitized fixtures for every public operation', () => {
		assert.deepEqual(files.sort(), [
			'change-property-status.json',
			'confirm-meeting.json',
			'create-contact.json',
			'create-meeting.json',
			'create-opportunity.json',
			'create-owner.json',
			'create-property.json',
			'get-acquisition.json',
			'get-contact.json',
			'get-opportunity.json',
			'get-owner.json',
			'get-project.json',
			'get-property-portal-publications.json',
			'get-property-status-history.json',
			'get-property.json',
			'retry-portal-publication.json',
			'search-acquisitions.json',
			'search-advisors.json',
			'search-contacts.json',
			'search-meetings.json',
			'search-opportunities.json',
			'search-owners.json',
			'search-profiles.json',
			'search-projects.json',
			'search-properties.json',
			'update-contact.json',
			'update-meeting.json',
			'update-owner.json',
			'update-property.json',
		]);
	});

	for (const fileName of files) {
		it(`${fileName} is sanitized and executable as a manual workflow`, () => {
			const workflow = JSON.parse(readFileSync(join(examplesDir, fileName), 'utf8'));
			const serialized = JSON.stringify(workflow);

			assert.doesNotMatch(serialized, /Bearer/i);
			assert.doesNotMatch(serialized, /DOMUS_TEST_TOKEN/);
			assert.doesNotMatch(serialized, /DOMUS_CRM_TEST_TOKEN/);
			assert.equal(workflow.pinData && Object.keys(workflow.pinData).length, 0);

			const crmOperations = {
				'confirm-meeting.json': { resource: 'meeting', operation: 'confirm' },
				'create-contact.json': { resource: 'contact', operation: 'create' },
				'create-meeting.json': { resource: 'meeting', operation: 'create' },
				'create-opportunity.json': { resource: 'opportunity', operation: 'create' },
				'get-contact.json': { resource: 'contact', operation: 'get' },
				'get-opportunity.json': { resource: 'opportunity', operation: 'get' },
				'search-contacts.json': { resource: 'contact', operation: 'search' },
				'search-meetings.json': { resource: 'meeting', operation: 'search' },
				'search-opportunities.json': { resource: 'opportunity', operation: 'search' },
				'search-profiles.json': { resource: 'profile', operation: 'search' },
				'update-contact.json': { resource: 'contact', operation: 'update' },
				'update-meeting.json': { resource: 'meeting', operation: 'update' },
			};
			if (crmOperations[fileName]) {
				const crmNodes = workflow.nodes.filter((node) => node.type === 'n8n-nodes-domus.domusCrm');
				assert.equal(crmNodes.length, 1);
				assert.equal(crmNodes[0].credentials, undefined);
				assert.equal(crmNodes[0].parameters.resource, crmOperations[fileName].resource);
				assert.equal(crmNodes[0].parameters.operation, crmOperations[fileName].operation);
				assert.doesNotMatch(serialized, /"id":\s*"[^"]*credential/i);
				assert.equal(
					workflow.nodes.some((node) => node.type === 'n8n-nodes-domus.domus'),
					false,
				);
				return;
			}

			const domusNodes = workflow.nodes.filter((node) => node.type === 'n8n-nodes-domus.domus');
			assert.ok(domusNodes.length >= 1);
			for (const node of domusNodes) {
				assert.equal(node.credentials, undefined);
				const operations = operationsByResource[node.parameters.resource];
				assert.ok(operations, `unknown resource ${node.parameters.resource}`);
				assert.ok(operations.includes(node.parameters.operation));
			}
		});
	}

	it('executes CRM search examples and skips meeting writes and opportunity create', () => {
		const workflowTest = readFileSync(join(__dirname, 'workflow/n8n-rest.workflow.test.js'), 'utf8');

		assert.match(workflowTest, /search-meetings\.json/);
		assert.match(workflowTest, /search-opportunities\.json/);
		assert.match(workflowTest, /search-profiles\.json/);
		assert.match(workflowTest, /search-contacts\.json/);
		assert.doesNotMatch(workflowTest, /create-meeting\.json/);
		assert.doesNotMatch(workflowTest, /create-opportunity\.json/);
		assert.doesNotMatch(workflowTest, /create-contact\.json/);
		assert.doesNotMatch(workflowTest, /get-opportunity\.json/);
		assert.doesNotMatch(workflowTest, /get-contact\.json/);
		assert.doesNotMatch(workflowTest, /update-meeting\.json/);
		assert.doesNotMatch(workflowTest, /update-contact\.json/);
		assert.doesNotMatch(workflowTest, /confirm-meeting\.json/);
	});
});

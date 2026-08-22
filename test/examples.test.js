const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { describe, it } = require('node:test');
const { join } = require('node:path');

const examplesDir = join(__dirname, '../examples');

describe('packaged example workflows', () => {
	const files = readdirSync(examplesDir).filter((name) => name.endsWith('.json'));

	it('ships at least the Search and Get fixtures', () => {
		assert.deepEqual(files.sort(), ['get-property.json', 'search-properties.json']);
	});

	for (const fileName of files) {
		it(`${fileName} is sanitized and executable as a manual workflow`, () => {
			const workflow = JSON.parse(readFileSync(join(examplesDir, fileName), 'utf8'));
			const serialized = JSON.stringify(workflow);

			assert.doesNotMatch(serialized, /Bearer/i);
			assert.doesNotMatch(serialized, /DOMUS_TEST_TOKEN/);
			assert.equal(workflow.pinData && Object.keys(workflow.pinData).length, 0);

			const domusNodes = workflow.nodes.filter((node) => node.type === 'n8n-nodes-domus.domus');
			assert.ok(domusNodes.length >= 1);
			for (const node of domusNodes) {
				assert.equal(node.credentials, undefined);
				assert.equal(node.parameters.resource, 'property');
				assert.ok(['search', 'get'].includes(node.parameters.operation));
			}
		});
	}
});

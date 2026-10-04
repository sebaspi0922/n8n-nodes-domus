import { expect, test } from '@playwright/test';
import { hasDomusCrmToken } from './helpers/env';
import {
	addDomusCrmNode,
	createDomusCrmCredentialViaApi,
	ensureOwner,
	executeOpenNode,
	expectDomusCrmNodeOpen,
	openBlankWorkflow,
	searchDomusCrmInCreator,
} from './helpers/n8n';

const today = () => {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${now.getFullYear()}-${month}-${day}`;
};

test.beforeEach(async ({ page }) => {
	await ensureOwner(page);
});

test('shows Domus CRM in the nodes panel', async ({ page }) => {
	await openBlankWorkflow(page);
	await searchDomusCrmInCreator(page);
	await expect(page.getByText('Domus', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Search meetings', { exact: true })).toBeVisible();
	await expect(page.getByText('Get a meeting', { exact: true })).toBeVisible();
});

test('shows a token field and no environment selector on the CRM credential', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusCrmNode(page);
	await expectDomusCrmNodeOpen(page);

	// Once any Domus credential is saved, n8n shows a credential dropdown instead of the setup button.
	const setupButton = page.getByTestId('setup-credential-button');
	const credentialSelect = page.getByTestId('node-credentials-select');
	await expect(setupButton.or(credentialSelect)).toBeVisible();
	if (await setupButton.isVisible()) {
		await setupButton.click();
	} else {
		await credentialSelect.click();
		await page.getByTestId('node-credentials-select-item-new').click();
	}

	const modal = page.getByTestId('editCredential-modal');
	await expect(modal).toBeVisible();
	await expect(modal.getByText('Domus CRM API').first()).toBeVisible();
	await expect(modal.getByText('Token *')).toBeVisible();
	await expect(modal.getByText('Environment', { exact: true })).toHaveCount(0);
});

test('shows meeting search dates and the type selector', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusCrmNode(page);
	await expectDomusCrmNodeOpen(page);

	await expect(page.getByText('Start Date', { exact: true })).toBeVisible();
	await expect(page.getByText('End Date', { exact: true })).toBeVisible();
	await expect(page.getByText('Meeting Type', { exact: true })).toBeVisible();
	const profile = page.getByTestId('parameter-input-profile');
	await expect(profile).toBeVisible();
	await expect(profile.getByTestId('rlc-mode-selector').getByRole('combobox')).toHaveValue(/from list/i);
	await expect(page.getByTestId('parameter-input-branch')).toHaveCount(0);
	await expect(page.getByTestId('parameter-input-name')).toHaveCount(0);
	await expect(page.getByTestId('parameter-input-altCode')).toHaveCount(0);
	await expect(page.getByTestId('parameter-input-phone')).toHaveCount(0);
	await expect(page.getByText('Source', { exact: true })).toHaveCount(0);
	await expect(page.getByText('Meeting ID', { exact: true })).toHaveCount(0);
	await expect(page.getByText('Finish Date', { exact: true })).toHaveCount(0);
	// n8n keeps its own hidden Notes setting in the panel, so only visible matches count.
	await expect(page.getByText('Notes', { exact: true }).filter({ visible: true })).toHaveCount(0);
	await expect(page.getByText('Confirm Attendance', { exact: true })).toHaveCount(0);
});

test('shows meeting create fields without search or confirm fields', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusCrmNode(page, 'Create a meeting');

	const panel = page.getByTestId('ndv');
	await expect(panel).toBeVisible();
	await expect(panel.getByText('Start Date', { exact: true })).toBeVisible();
	await expect(panel.getByText('Finish Date', { exact: true })).toBeVisible();
	await expect(panel.getByText('Notes', { exact: true }).filter({ visible: true })).toBeVisible();
	await expect(panel.getByText('Meeting Type', { exact: true })).toBeVisible();
	await expect(panel.getByText('Place', { exact: true })).toBeVisible();
	await expect(panel.getByText('Property Code', { exact: true })).toBeVisible();
	await expect(panel.getByText('Contact', { exact: true })).toBeVisible();
	await expect(panel.getByText('Broker', { exact: true })).toBeVisible();
	await expect(panel.getByText('End Date', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Meeting ID', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Profile', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Status', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Confirm Attendance', { exact: true })).toHaveCount(0);
});

test('shows meeting update fields without create or confirm fields', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusCrmNode(page, 'Update a meeting');

	const panel = page.getByTestId('ndv');
	await expect(panel).toBeVisible();
	await expect(panel.getByText('Meeting ID', { exact: true })).toBeVisible();
	await expect(panel.getByText('Status', { exact: true })).toBeVisible();
	await expect(panel.getByText('Result', { exact: true })).toBeVisible();
	await expect(panel.getByText('Latitude', { exact: true })).toBeVisible();
	await expect(panel.getByText('Longitude', { exact: true })).toBeVisible();
	await expect(panel.getByText('Comment', { exact: true })).toBeVisible();
	await expect(panel.getByText('Opportunity Status', { exact: true })).toBeVisible();
	await expect(panel.getByText('Start Date', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Notes', { exact: true }).filter({ visible: true })).toHaveCount(0);
	await expect(panel.getByText('Place', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Confirm Attendance', { exact: true })).toHaveCount(0);
});

test('shows meeting confirm fields without create or update fields', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusCrmNode(page, 'Confirm a meeting');

	const panel = page.getByTestId('ndv');
	await expect(panel).toBeVisible();
	await expect(panel.getByText('Meeting ID', { exact: true })).toBeVisible();
	await expect(panel.getByText('Confirm Attendance', { exact: true })).toBeVisible();
	await expect(panel.getByText('Start Date', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Notes', { exact: true }).filter({ visible: true })).toHaveCount(0);
	await expect(panel.getByText('Status', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Result', { exact: true })).toHaveCount(0);
});

test('shows opportunity search filters without meeting fields', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusCrmNode(page, 'Search opportunities');

	const panel = page.getByTestId('ndv');
	await expect(panel).toBeVisible();
	await expect(panel.getByTestId('parameter-input-resource').getByRole('combobox')).toHaveValue('Opportunity');
	await expect(panel.getByText('Contact', { exact: true })).toBeVisible();
	await expect(panel.getByText('Activity Status', { exact: true })).toBeVisible();
	await expect(panel.getByText('Opportunity Status', { exact: true })).toBeVisible();
	await expect(panel.getByText('Service', { exact: true })).toBeVisible();
	await expect(panel.getByText('Last Follow Update From', { exact: true })).toBeVisible();
	await expect(panel.getByText('Last Follow Update To', { exact: true })).toBeVisible();
	await expect(panel.getByText('Opportunity ID', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Date', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Comment', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Start Date', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Meeting Type', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Meeting ID', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Notes', { exact: true }).filter({ visible: true })).toHaveCount(0);
	await expect(panel.getByText('Profile', { exact: true })).toHaveCount(0);
	await expect(panel.getByTestId('parameter-input-branch')).toHaveCount(0);
	await expect(panel.getByText('Alternative Code', { exact: true })).toHaveCount(0);
	await expect(panel.getByTestId('parameter-input-phone')).toHaveCount(0);
	await expect(panel.getByText('Source', { exact: true })).toHaveCount(0);
});

test('shows opportunity get fields without search or create fields', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusCrmNode(page, 'Get an opportunity');

	const panel = page.getByTestId('ndv');
	await expect(panel).toBeVisible();
	await expect(panel.getByText('Opportunity ID', { exact: true })).toBeVisible();
	await expect(panel.getByText('Activity Status', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Opportunity Status', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Last Follow Update From', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Date', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Comment', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Service', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Meeting ID', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Start Date', { exact: true })).toHaveCount(0);
});

test('shows opportunity create fields without executing a write', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusCrmNode(page, 'Create an opportunity');

	const panel = page.getByTestId('ndv');
	await expect(panel).toBeVisible();
	await expect(panel.getByText('Date', { exact: true })).toBeVisible();
	await expect(panel.getByText('Comment', { exact: true })).toBeVisible();
	await expect(panel.getByText('Service', { exact: true })).toBeVisible();
	await expect(panel.getByText('Contact', { exact: true })).toBeVisible();
	await expect(panel.getByText('Property Code', { exact: true })).toBeVisible();
	await expect(panel.getByText('Value', { exact: true })).toBeVisible();
	await expect(panel.getByText('Activity Status', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Opportunity Status', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Opportunity ID', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Last Follow Update From', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Start Date', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Notes', { exact: true }).filter({ visible: true })).toHaveCount(0);
	await expect(panel.getByText('Meeting Type', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Profile', { exact: true })).toHaveCount(0);
	await expect(panel.getByTestId('parameter-input-branch')).toHaveCount(0);
	await expect(panel.getByText('Alternative Code', { exact: true })).toHaveCount(0);
});

test('shows profile search filters without meeting or opportunity fields', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusCrmNode(page, 'Search profiles');

	const panel = page.getByTestId('ndv');
	await expect(panel).toBeVisible();
	await expect(panel.getByTestId('parameter-input-resource').getByRole('combobox')).toHaveValue('Profile');
	await expect(panel.getByTestId('parameter-input-branch')).toBeVisible();
	await expect(panel.getByTestId('parameter-input-name')).toBeVisible();
	await expect(panel.getByTestId('parameter-input-altCode')).toBeVisible();
	await expect(panel.getByText('Branch', { exact: true })).toBeVisible();
	await expect(panel.getByText('Name', { exact: true })).toBeVisible();
	await expect(panel.getByText('Alternative Code', { exact: true })).toBeVisible();
	await expect(panel.getByTestId('parameter-input-profile')).toHaveCount(0);
	await expect(panel.getByTestId('parameter-input-phone')).toHaveCount(0);
	await expect(panel.getByText('Source', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('From List', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Start Date', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Meeting Type', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Activity Status', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Opportunity Status', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Opportunity ID', { exact: true })).toHaveCount(0);
});

test('shows contact search name and phone without other resource fields', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusCrmNode(page, 'Search contacts');

	const panel = page.getByTestId('ndv');
	await expect(panel).toBeVisible();
	await expect(panel.getByTestId('parameter-input-resource').getByRole('combobox')).toHaveValue('Contact');
	await expect(panel.getByTestId('parameter-input-name')).toBeVisible();
	await expect(panel.getByTestId('parameter-input-phone')).toBeVisible();
	await expect(panel.getByText('Name', { exact: true })).toBeVisible();
	await expect(panel.getByText('Phone', { exact: true })).toBeVisible();
	await expect(panel.getByText('Source', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Email', { exact: true })).toHaveCount(0);
	await expect(panel.getByTestId('parameter-input-code')).toHaveCount(0);
	await expect(panel.getByText('Start Date', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Meeting Type', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Activity Status', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Opportunity ID', { exact: true })).toHaveCount(0);
	await expect(panel.getByTestId('parameter-input-branch')).toHaveCount(0);
	await expect(panel.getByText('Alternative Code', { exact: true })).toHaveCount(0);
	await expect(panel.getByTestId('parameter-input-profile')).toHaveCount(0);
});

test('shows contact create fields without executing a write', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusCrmNode(page, 'Create a contact');

	const panel = page.getByTestId('ndv');
	await expect(panel).toBeVisible();
	await expect(panel.getByText('Name', { exact: true })).toBeVisible();
	await expect(panel.getByText('Source', { exact: true })).toBeVisible();
	await expect(panel.getByText('Email', { exact: true })).toBeVisible();
	await expect(panel.getByText('Phone', { exact: true })).toBeVisible();
	await expect(panel.getByText('Last Name', { exact: true })).toBeVisible();
	await expect(panel.getByText('Birth Date', { exact: true })).toBeVisible();
	await expect(panel.getByText('City', { exact: true })).toBeVisible();
	await expect(panel.getByText('Neighborhood', { exact: true })).toBeVisible();
	await expect(panel.getByText('Description', { exact: true })).toBeVisible();
	await expect(panel.getByText('Broker', { exact: true })).toBeVisible();
	await expect(panel.getByText('From List', { exact: true })).toHaveCount(0);
	await expect(panel.getByTestId('parameter-input-code')).toHaveCount(0);
	await expect(panel.getByText('Start Date', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Meeting Type', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Activity Status', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Opportunity ID', { exact: true })).toHaveCount(0);
	await expect(panel.getByTestId('parameter-input-branch')).toHaveCount(0);
	await expect(panel.getByText('Alternative Code', { exact: true })).toHaveCount(0);
	await expect(panel.getByTestId('parameter-input-profile')).toHaveCount(0);
});

test('shows contact update fields without executing a write', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusCrmNode(page, 'Update a contact');

	const panel = page.getByTestId('ndv');
	await expect(panel).toBeVisible();
	await expect(panel.getByText('Code', { exact: true })).toBeVisible();
	await expect(panel.getByText('Name', { exact: true })).toBeVisible();
	await expect(panel.getByText('Email', { exact: true })).toBeVisible();
	await expect(panel.getByText('Description', { exact: true })).toBeVisible();
	await expect(panel.getByText('Phone', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Source', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Last Name', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Broker', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('City', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Birth Date', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Start Date', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Meeting Type', { exact: true })).toHaveCount(0);
	await expect(panel.getByText('Opportunity ID', { exact: true })).toHaveCount(0);
	await expect(panel.getByTestId('parameter-input-branch')).toHaveCount(0);
	await expect(panel.getByTestId('parameter-input-profile')).toHaveCount(0);
});

test('executes Contact Search when a CRM token is available', async ({ page }) => {
	test.skip(!hasDomusCrmToken, 'Set DOMUS_CRM_TEST_TOKEN to execute Search against the Domus CRM API');

	await createDomusCrmCredentialViaApi(page.request);
	await openBlankWorkflow(page);
	await addDomusCrmNode(page, 'Search contacts');

	const panel = page.getByTestId('ndv');
	await expect(panel).toBeVisible();
	await executeOpenNode(page);

	const output = panel.getByTestId('ndv-output-panel');
	await expect(
		output.getByTestId('run-data-item-count').or(output.getByText(/no output data/i)),
	).toBeVisible({ timeout: 30_000 });
	await expect(page.getByText(/problem in node/i)).toHaveCount(0);
});

test('executes Profile Search when a CRM token is available', async ({ page }) => {
	test.skip(!hasDomusCrmToken, 'Set DOMUS_CRM_TEST_TOKEN to execute Search against the Domus CRM API');

	await createDomusCrmCredentialViaApi(page.request);
	await openBlankWorkflow(page);
	await addDomusCrmNode(page, 'Search profiles');

	const panel = page.getByTestId('ndv');
	await expect(panel).toBeVisible();
	await executeOpenNode(page);

	const output = panel.getByTestId('ndv-output-panel');
	await expect(
		output.getByTestId('run-data-item-count').or(output.getByText(/no output data/i)),
	).toBeVisible({ timeout: 30_000 });
	await expect(page.getByText(/problem in node/i)).toHaveCount(0);
});

test('executes Opportunity Search when a CRM token is available', async ({ page }) => {
	test.skip(!hasDomusCrmToken, 'Set DOMUS_CRM_TEST_TOKEN to execute Search against the Domus CRM API');

	await createDomusCrmCredentialViaApi(page.request);
	await openBlankWorkflow(page);
	await addDomusCrmNode(page, 'Search opportunities');

	const panel = page.getByTestId('ndv');
	await expect(panel).toBeVisible();
	await executeOpenNode(page);

	const output = panel.getByTestId('ndv-output-panel');
	await expect(
		output.getByTestId('run-data-item-count').or(output.getByText(/no output data/i)),
	).toBeVisible({ timeout: 30_000 });
	await expect(page.getByText(/problem in node/i)).toHaveCount(0);
});

test('executes Meeting Search when a CRM token is available', async ({ page }) => {
	test.skip(!hasDomusCrmToken, 'Set DOMUS_CRM_TEST_TOKEN to execute Search against the Domus CRM API');

	await createDomusCrmCredentialViaApi(page.request);
	await openBlankWorkflow(page);
	await addDomusCrmNode(page);
	await expectDomusCrmNodeOpen(page);

	const day = today();
	const startDate = page
		.getByTestId('parameter-input-startDate')
		.locator('input')
		.or(page.getByRole('textbox', { name: /start date/i }));
	const endDate = page
		.getByTestId('parameter-input-endDate')
		.locator('input')
		.or(page.getByRole('textbox', { name: /end date/i }));
	await startDate.first().fill(day);
	await endDate.first().fill(day);
	await executeOpenNode(page);

	const output = page.getByTestId('ndv').getByTestId('ndv-output-panel');
	await expect(
		output.getByTestId('run-data-item-count').or(output.getByText(/no output data/i)),
	).toBeVisible({ timeout: 30_000 });
	await expect(page.getByText(/problem in node/i)).toHaveCount(0);
});

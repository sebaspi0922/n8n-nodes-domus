import type { INodeProperties } from 'n8n-workflow';

interface AdvisorWriteFieldOptions {
	includeIdentity?: boolean;
	includeStatus?: boolean;
}

const bodyStringField = (
	displayName: string,
	name: string,
	property: string,
	description: string,
	placeholder?: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	description,
	placeholder,
	routing: {
		send: {
			type: 'body',
			property,
		},
	},
});

export const advisorWriteFields = (options: AdvisorWriteFieldOptions = {}): INodeProperties[] => {
	const fields: INodeProperties[] = [
		bodyStringField('Address', 'address', 'address', 'Office address of the advisor', 'e.g. Calle 10'),
		bodyStringField(
			'Alternative Email',
			'alternativeEmail',
			'alternative_email',
			'Secondary email address',
			'e.g. advisor.alt@example.com',
		),
		bodyStringField(
			'Department',
			'department',
			'department',
			'Department the advisor works in at the agency, such as sales. This is not a geographic department.',
			'e.g. Ventas',
		),
		bodyStringField('Description', 'description', 'description', 'Advisor profile text'),
		bodyStringField('Email', 'email', 'email', 'Advisor email address', 'e.g. advisor@example.com'),
		bodyStringField(
			'MLS Business Type',
			'mlsBiz',
			'mls_biz',
			'Business type assigned to the advisor',
			'e.g. 1',
		),
		bodyStringField(
			'Mobile Phone',
			'mobilePhone',
			'mobile_phone',
			'Mobile number. Required by Domus on create when Phone is empty.',
			'e.g. 3001234567',
		),
		{
			displayName: 'Display Order',
			name: 'order',
			type: 'number',
			default: 0,
			description: 'Display order, especially for public websites',
			routing: {
				send: {
					type: 'body',
					property: 'order',
				},
			},
		},
		bodyStringField(
			'Phone',
			'phone',
			'phone',
			'Landline. Required by Domus on create when Mobile Phone is empty.',
			'e.g. 6011234567',
		),
		bodyStringField(
			'Picture URL',
			'pictureUrl',
			'picture_url',
			'Public URL of the advisor photo',
			'e.g. https://example.com/advisor.jpg',
		),
		bodyStringField(
			'Verification Digit',
			'verificationDigit',
			'verification_digit',
			'Verification digit when the document is a NIT or otherwise requires one',
			'e.g. 1',
		),
	];

	if (options.includeIdentity) {
		fields.push(
			bodyStringField('Document', 'document', 'document', 'Identification document number'),
			bodyStringField('First Name', 'name', 'name', 'Advisor given names'),
			bodyStringField('Last Name', 'lastName', 'last_name', 'Advisor family names'),
		);
	}

	if (options.includeStatus) {
		fields.push({
			displayName: 'Status',
			name: 'status',
			type: 'options',
			default: '1',
			description: 'Whether the advisor profile is active or inactive',
			options: [
				{ name: 'Active', value: '1' },
				{ name: 'Inactive', value: '2' },
			],
			routing: {
				send: {
					type: 'body',
					property: 'status',
				},
			},
		});
	}

	return fields.sort((left, right) =>
		left.displayName.localeCompare(right.displayName, 'en', { sensitivity: 'base' }),
	);
};

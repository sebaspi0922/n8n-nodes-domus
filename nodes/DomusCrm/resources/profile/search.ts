import type { INodeProperties } from 'n8n-workflow';

const showOnlyForProfileSearch = {
	operation: ['search'],
	resource: ['profile'],
};

const omitEmptyValue = '={{ $value ? $value : undefined }}';

export const profileSearchDescription: INodeProperties[] = [
	{
		displayName: 'Branch',
		name: 'branch',
		type: 'number',
		default: 0,
		description: 'Numeric branch ID. There is no branch list for this field. Omitted when left at 0.',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: showOnlyForProfileSearch,
		},
		routing: {
			send: {
				type: 'query',
				property: 'branch',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'First name or last name. Omitted when empty.',
		displayOptions: {
			show: showOnlyForProfileSearch,
		},
		routing: {
			send: {
				type: 'query',
				property: 'name',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Alternative Code',
		name: 'altCode',
		type: 'number',
		default: 0,
		description:
			'Numeric alternative MLS code. This is not the profile code. Omitted when left at 0.',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: showOnlyForProfileSearch,
		},
		routing: {
			send: {
				type: 'query',
				property: 'alt_code',
				value: omitEmptyValue,
			},
		},
	},
];

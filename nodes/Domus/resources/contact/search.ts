import type { INodeProperties } from 'n8n-workflow';

const showOnlyForContactSearch = {
	operation: ['search'],
	resource: ['contact'],
};

const omitEmptyValue = '={{ $value ? $value : undefined }}';

export const contactSearchDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'Name, part of the name, or part of the email. Omitted when empty.',
		displayOptions: {
			show: showOnlyForContactSearch,
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
		displayName: 'Phone',
		name: 'phone',
		type: 'string',
		default: '',
		description: 'Phone number or part of the number. Omitted when empty.',
		displayOptions: {
			show: showOnlyForContactSearch,
		},
		routing: {
			send: {
				type: 'query',
				property: 'phone',
				value: omitEmptyValue,
			},
		},
	},
];

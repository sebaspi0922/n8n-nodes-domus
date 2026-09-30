import type { INodeProperties } from 'n8n-workflow';

const showOnlyForContactUpdate = {
	operation: ['update'],
	resource: ['contact'],
};

const omitEmptyValue = '={{ $value ? $value : undefined }}';

export const contactUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'Contact name. Omitted when empty.',
		displayOptions: {
			show: showOnlyForContactUpdate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'name',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		placeholder: 'e.g. name@email.com',
		description: 'Contact email. Omitted when empty.',
		displayOptions: {
			show: showOnlyForContactUpdate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'email',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		description: 'Comment about the contact. Omitted when empty.',
		displayOptions: {
			show: showOnlyForContactUpdate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'description',
				value: omitEmptyValue,
			},
		},
	},
];

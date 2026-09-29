import type { INodeProperties } from 'n8n-workflow';

export const contactGetDescription: INodeProperties[] = [
	{
		displayName: 'Code',
		name: 'code',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 12345',
		description: 'Identifier returned as code by Search',
		displayOptions: {
			show: {
				operation: ['get', 'update'],
				resource: ['contact'],
			},
		},
	},
];

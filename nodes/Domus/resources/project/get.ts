import type { INodeProperties } from 'n8n-workflow';

const showOnlyForProjectGet = {
	operation: ['get'],
	resource: ['project'],
};

export const projectGetDescription: INodeProperties[] = [
	{
		displayName: 'Project Code',
		name: 'projectCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 123',
		description:
			'Code the agency assigned to the project. Send 0 when the project has no assigned code and identify it with Unique Code instead.',
		displayOptions: {
			show: showOnlyForProjectGet,
		},
	},
	{
		displayName: 'Unique Code',
		name: 'projectUniqueCode',
		type: 'string',
		default: '',
		placeholder: 'e.g. 1',
		description: 'Automatic Domus code, required when the project code is 0',
		displayOptions: {
			show: showOnlyForProjectGet,
		},
		routing: {
			send: {
				type: 'query',
				property: 'unique_code',
			},
		},
	},
];

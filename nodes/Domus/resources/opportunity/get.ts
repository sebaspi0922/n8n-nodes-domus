import type { INodeProperties } from 'n8n-workflow';

export const opportunityGetDescription: INodeProperties[] = [
	{
		displayName: 'Opportunity ID',
		name: 'opportunityId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 12345',
		description: 'Identifier returned as opportunity_id by Search',
		displayOptions: {
			show: {
				operation: ['get'],
				resource: ['opportunity'],
			},
		},
	},
];

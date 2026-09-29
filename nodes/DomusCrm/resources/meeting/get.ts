import type { INodeProperties } from 'n8n-workflow';

export const meetingGetDescription: INodeProperties[] = [
	{
		displayName: 'Meeting ID',
		name: 'meetingId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 123456789',
		description: 'Identifier returned as meeting_id by Search',
		displayOptions: {
			show: {
				operation: ['get', 'update', 'confirm'],
				resource: ['meeting'],
			},
		},
	},
];

import type { INodeProperties } from 'n8n-workflow';

const showOnlyForMeetingConfirm = {
	operation: ['confirm'],
	resource: ['meeting'],
};

export const meetingConfirmDescription: INodeProperties[] = [
	{
		displayName: 'Confirm Attendance',
		name: 'verify',
		type: 'options',
		required: true,
		default: 1,
		description: '1 confirms attendance and 0 does not',
		displayOptions: {
			show: showOnlyForMeetingConfirm,
		},
		options: [
			{
				name: 'Confirm',
				value: 1,
			},
			{
				name: 'Do Not Confirm',
				value: 0,
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'verify',
			},
		},
	},
];

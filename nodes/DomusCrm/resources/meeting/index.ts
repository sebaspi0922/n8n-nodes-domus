import type { INodeProperties } from 'n8n-workflow';
import { meetingConfirmDescription } from './confirm';
import { meetingCreateDescription, requireMeetingPlaceOrPropertyCode } from './create';
import { meetingGetDescription } from './get';
import { meetingSearchDescription } from './search';
import { meetingUpdateDescription } from './update';

const showOnlyForMeetings = {
	resource: ['meeting'],
};

export const meetingDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForMeetings,
		},
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search meetings',
				description: 'Search meetings and return each result as an n8n item',
				routing: {
					request: {
						method: 'GET',
						url: '/meetings',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'data',
								},
							},
						],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a meeting',
				description: 'Get one meeting by meeting_id',
				routing: {
					request: {
						method: 'GET',
						url: '=/meetings/{{$parameter.meetingId}}',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'data',
								},
							},
						],
					},
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a meeting',
				description:
					'Create a meeting. Send the fields as form-urlencoded. The response object includes an ID.',
				routing: {
					request: {
						method: 'POST',
						url: '/meetings',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
						},
					},
					send: {
						preSend: [requireMeetingPlaceOrPropertyCode],
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a meeting',
				description: 'Update a meeting status and result by meeting_id',
				routing: {
					request: {
						method: 'PUT',
						url: '=/meetings/{{$parameter.meetingId}}',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
						},
					},
				},
			},
			{
				name: 'Confirm',
				value: 'confirm',
				action: 'Confirm a meeting',
				description: 'Confirm or reject attendance. The response is a message.',
				routing: {
					request: {
						method: 'PUT',
						url: '=/meetings/verify/{{$parameter.meetingId}}',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
						},
					},
				},
			},
		],
		default: 'search',
	},
	...meetingSearchDescription,
	...meetingGetDescription,
	...meetingCreateDescription,
	...meetingUpdateDescription,
	...meetingConfirmDescription,
];

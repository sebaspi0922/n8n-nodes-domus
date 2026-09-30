import type { INodeProperties } from 'n8n-workflow';
import { createCrmLocator } from '../crmLocators';

const showOnlyForMeetingUpdate = {
	operation: ['update'],
	resource: ['meeting'],
};

const omitEmptyValue = '={{ $value ? $value : undefined }}';

export const meetingUpdateDescription: INodeProperties[] = [
	createCrmLocator({
		displayName: 'Status',
		name: 'status',
		placeholder: 'e.g. 1',
		description: 'Meeting status ID from this CRM API',
		required: true,
		displayOptions: {
			show: showOnlyForMeetingUpdate,
		},
		searchListMethod: 'searchMeetingStatuses',
		sendProperty: 'status',
		sendType: 'body',
	}),
	createCrmLocator({
		displayName: 'Result',
		name: 'result',
		placeholder: 'e.g. 37',
		description: 'Meeting result ID. The list is filtered by the selected status.',
		required: true,
		displayOptions: {
			show: showOnlyForMeetingUpdate,
		},
		loadOptionsDependsOn: ['status.value'],
		searchListMethod: 'searchMeetingResults',
		sendProperty: 'result',
		sendType: 'body',
	}),
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		default: 0,
		description: 'Latitude recorded with the update. Omitted when left at 0.',
		displayOptions: {
			show: showOnlyForMeetingUpdate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'latitude',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Longitude',
		name: 'longitude',
		type: 'number',
		default: 0,
		description: 'Longitude recorded with the update. Omitted when left at 0.',
		displayOptions: {
			show: showOnlyForMeetingUpdate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'longitude',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Comment',
		name: 'comment',
		type: 'string',
		default: '',
		description: 'Comment stored with the status change. Omitted when empty.',
		displayOptions: {
			show: showOnlyForMeetingUpdate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'comment',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Opportunity Status',
		name: 'opportunityStatus',
		type: 'number',
		default: 0,
		description: 'Numeric opportunity status ID from this CRM API. Omitted when left at 0.',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: showOnlyForMeetingUpdate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'opportunity_status',
				value: omitEmptyValue,
			},
		},
	},
];

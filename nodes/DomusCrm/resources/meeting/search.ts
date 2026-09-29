import type { INodeProperties } from 'n8n-workflow';
import { createCrmLocator } from '../locators';

const showOnlyForMeetingSearch = {
	operation: ['search'],
	resource: ['meeting'],
};

export const meetingSearchDescription: INodeProperties[] = [
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'YYYY-MM-DD',
		description: 'Range start, in YYYY-MM-DD format',
		displayOptions: {
			show: showOnlyForMeetingSearch,
		},
		routing: {
			send: {
				type: 'query',
				property: 'start_date',
			},
		},
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'YYYY-MM-DD',
		description: 'Range end, in YYYY-MM-DD format. Use the same day as Start Date for one day.',
		displayOptions: {
			show: showOnlyForMeetingSearch,
		},
		routing: {
			send: {
				type: 'query',
				property: 'end_date',
			},
		},
	},
	createCrmLocator({
		displayName: 'Profile',
		name: 'profile',
		placeholder: 'e.g. 1',
		description: 'Profile code from this CRM API, sent as profile. The list value is code.',
		displayOptions: {
			show: showOnlyForMeetingSearch,
		},
		searchListMethod: 'searchProfiles',
		sendProperty: 'profile',
	}),
	createCrmLocator({
		displayName: 'Meeting Type',
		name: 'meetingType',
		placeholder: 'e.g. 2299',
		description: 'Meeting type ID from this CRM API',
		displayOptions: {
			show: showOnlyForMeetingSearch,
		},
		searchListMethod: 'searchMeetingTypes',
		sendProperty: 'type',
	}),
];

import type { INodeProperties } from 'n8n-workflow';
import { createCrmLocator } from '../crmLocators';

const showOnlyForOpportunitySearch = {
	operation: ['search'],
	resource: ['opportunity'],
};

const omitEmptyValue = '={{ $value ? $value : undefined }}';

export const opportunitySearchDescription: INodeProperties[] = [
	{
		displayName: 'Contact',
		name: 'contact',
		type: 'number',
		default: 0,
		description: 'Numeric contact ID from this CRM API. Omitted when left at 0.',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: showOnlyForOpportunitySearch,
		},
		routing: {
			send: {
				type: 'query',
				property: 'contact',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Activity Status',
		name: 'activityStatus',
		type: 'options',
		default: 0,
		description:
			'1 is active and 2 is inactive. Any does not send status. This is not the opportunity status list.',
		displayOptions: {
			show: showOnlyForOpportunitySearch,
		},
		options: [
			{
				name: 'Any',
				value: 0,
			},
			{
				name: 'Active',
				value: 1,
			},
			{
				name: 'Inactive',
				value: 2,
			},
		],
		routing: {
			send: {
				type: 'query',
				property: 'status',
				value: omitEmptyValue,
			},
		},
	},
	createCrmLocator({
		displayName: 'Opportunity Status',
		name: 'statusId',
		placeholder: 'e.g. 3858',
		description:
			'Opportunity status ID from GET /opportunities/status, sent as status_id. This is not the active or inactive filter.',
		displayOptions: {
			show: showOnlyForOpportunitySearch,
		},
		searchListMethod: 'searchOpportunityStatuses',
		sendProperty: 'status_id',
	}),
	{
		displayName: 'Service',
		name: 'service',
		type: 'number',
		default: 0,
		description:
			'Numeric service ID from this CRM API. There is no service list for this field. Omitted when left at 0.',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: showOnlyForOpportunitySearch,
		},
		routing: {
			send: {
				type: 'query',
				property: 'service',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Last Follow Update From',
		name: 'lastFollowUpdateFrom',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		description:
			'Start of the last follow-up range, in YYYY-MM-DD format. Create uses a different date format. Omitted when empty.',
		displayOptions: {
			show: showOnlyForOpportunitySearch,
		},
		routing: {
			send: {
				type: 'query',
				property: 'last_follow_update_from',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Last Follow Update To',
		name: 'lastFollowUpdateTo',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		description: 'End of the last follow-up range, in YYYY-MM-DD format. Omitted when empty.',
		displayOptions: {
			show: showOnlyForOpportunitySearch,
		},
		routing: {
			send: {
				type: 'query',
				property: 'last_follow_update_to',
				value: omitEmptyValue,
			},
		},
	},
];

import type { INodeProperties } from 'n8n-workflow';

const showOnlyForOpportunityCreate = {
	operation: ['create'],
	resource: ['opportunity'],
};

const omitEmptyValue = '={{ $value ? $value : undefined }}';

export const opportunityCreateDescription: INodeProperties[] = [
	{
		displayName: 'Date',
		name: 'date',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'yyyy-mm-dd hh:mm:ss',
		description:
			'Opportunity date in yyyy-mm-dd hh:mm:ss. Search follow-up filters use a different YYYY-MM-DD date.',
		displayOptions: {
			show: showOnlyForOpportunityCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'date',
			},
		},
	},
	{
		displayName: 'Comment',
		name: 'comment',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. First visit',
		description: 'Description of the opportunity',
		displayOptions: {
			show: showOnlyForOpportunityCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'comment',
			},
		},
	},
	{
		displayName: 'Service',
		name: 'service',
		type: 'number',
		required: true,
		default: 0,
		description:
			'Numeric service ID from this CRM API. There is no service list for this field.',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: showOnlyForOpportunityCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'service',
			},
		},
	},
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
			show: showOnlyForOpportunityCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'contact',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Property Code',
		name: 'property',
		type: 'string',
		default: '',
		placeholder: 'e.g. 29616',
		description: 'Property code (codpro). Omitted when empty.',
		displayOptions: {
			show: showOnlyForOpportunityCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'property',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Value',
		name: 'value',
		type: 'number',
		default: 0,
		description: 'Numeric value of the opportunity. Omitted when left at 0.',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: showOnlyForOpportunityCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'value',
				value: omitEmptyValue,
			},
		},
	},
];

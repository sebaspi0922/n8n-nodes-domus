import type { INodeProperties } from 'n8n-workflow';
import { DOMUS_CRM_BASE_URL } from '../../constants';
import { opportunityCreateDescription } from './create';
import { opportunityGetDescription } from './get';
import { opportunitySearchDescription } from './search';

const showOnlyForOpportunities = {
	resource: ['opportunity'],
};

export const opportunityDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForOpportunities,
		},
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search opportunities',
				description: 'Search opportunities and return each result as an n8n item',
				routing: {
					request: {
						baseURL: DOMUS_CRM_BASE_URL,
						method: 'GET',
						url: '/opportunities',
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
				action: 'Get an opportunity',
				description: 'Get one opportunity by opportunity_id. Follow-ups are included in the object.',
				routing: {
					request: {
						baseURL: DOMUS_CRM_BASE_URL,
						method: 'GET',
						url: '=/opportunities/{{$parameter.opportunityId}}',
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
				action: 'Create an opportunity',
				description:
					'Create an opportunity. Send the fields as form-urlencoded. The response object includes opportunity_id.',
				routing: {
					request: {
						baseURL: DOMUS_CRM_BASE_URL,
						method: 'POST',
						url: '/opportunities',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
						},
					},
				},
			},
		],
		default: 'search',
	},
	...opportunitySearchDescription,
	...opportunityGetDescription,
	...opportunityCreateDescription,
];

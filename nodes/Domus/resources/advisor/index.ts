import type { INodeProperties } from 'n8n-workflow';
import { advisorSearchDescription } from './search';

const showOnlyForAdvisors = {
	resource: ['advisor'],
};

export const advisorDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForAdvisors,
		},
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search advisors',
				description: 'Search for advisors and return each result as an n8n item',
				routing: {
					request: {
						method: 'GET',
						url: '/administrative/brokers',
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
		],
		default: 'search',
	},
	...advisorSearchDescription,
];

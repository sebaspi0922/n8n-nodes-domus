import type { INodeProperties } from 'n8n-workflow';
import { advisorCreateDescription } from './create';
import { advisorSearchDescription } from './search';
import { advisorUpdateDescription } from './update';

const showOnlyForAdvisors = {
	resource: ['advisor'],
};

const formUrlEncoded = {
	'Content-Type': 'application/x-www-form-urlencoded',
};

const brokerEnvelope = {
	postReceive: [
		{
			type: 'rootProperty' as const,
			properties: {
				property: 'broker',
			},
		},
	],
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
			{
				name: 'Create',
				value: 'create',
				action: 'Create an advisor',
				description: 'Create an advisor profile in the token agency',
				routing: {
					request: {
						method: 'POST',
						url: '/administrative/brokers',
						headers: formUrlEncoded,
					},
					output: brokerEnvelope,
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an advisor',
				description: 'Update an advisor profile. Domus documents no get-by-ID for a single advisor.',
				routing: {
					request: {
						method: 'PUT',
						url: '=/administrative/brokers/{{$parameter.advisorCode}}',
						headers: formUrlEncoded,
					},
					output: brokerEnvelope,
				},
			},
		],
		default: 'search',
	},
	...advisorSearchDescription,
	...advisorCreateDescription,
	...advisorUpdateDescription,
];

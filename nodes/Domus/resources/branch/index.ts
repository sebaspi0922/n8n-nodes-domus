import type { INodeProperties } from 'n8n-workflow';

const showOnlyForBranches = {
	resource: ['branch'],
};

const showOnlyWhenLimitingResults = {
	...showOnlyForBranches,
	returnAll: [false],
};

export const branchDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForBranches,
		},
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search branches',
				description: 'List the agency branches available to the token and return each one as an n8n item',
				routing: {
					request: {
						method: 'GET',
						url: '/administrative/branches',
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
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: showOnlyForBranches,
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		required: true,
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: showOnlyWhenLimitingResults,
		},
		routing: {
			output: {
				maxResults: '={{$value}}',
			},
		},
	},
];

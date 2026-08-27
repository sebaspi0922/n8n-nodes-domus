import type { INodeProperties } from 'n8n-workflow';
import { acquisitionGetDescription } from './get';
import { acquisitionSearchDescription } from './search';

const showOnlyForAcquisitions = {
	resource: ['acquisition'],
};

export const acquisitionDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForAcquisitions,
		},
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search acquisitions',
				description:
					'Search for Domus V2 acquisitions and return each result as an n8n item',
				routing: {
					request: {
						method: 'GET',
						url: '/captures-v2',
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
				action: 'Get an acquisition',
				description:
					'Get a Domus V2 acquisition with its property snapshot, advisor, and CRM contact',
				routing: {
					request: {
						method: 'GET',
						url: '=/captures-v2/{{$parameter.acquisitionCode}}',
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
	...acquisitionGetDescription,
	...acquisitionSearchDescription,
];

import type { INodeProperties } from 'n8n-workflow';
import { propertyGetDescription } from './get';
import { propertySearchDescription } from './search';

const showOnlyForProperties = {
	resource: ['property'],
};

export const propertyDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForProperties,
		},
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search properties',
				description: 'Search for properties and return each result as an n8n item',
				routing: {
					request: {
						method: 'GET',
						url: '/properties',
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
				action: 'Get a property',
				description: 'Get full property details by property code',
				routing: {
					request: {
						method: 'GET',
						url: '=/properties/{{$parameter.propertyCode}}{{$parameter.propertyId ? "/" + $parameter.propertyId : ""}}',
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
	...propertyGetDescription,
	...propertySearchDescription,
];

import type { INodeProperties } from 'n8n-workflow';
import { propertyChangeStatusDescription } from './changeStatus';
import { propertyGetDescription } from './get';
import { propertyGetStatusHistoryDescription } from './getStatusHistory';
import { propertySearchDescription } from './search';
import { splitNestedStatusHistory } from './statusHistory.helpers';

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
			{
				name: 'Get Status History',
				value: 'getStatusHistory',
				action: 'Get property status history',
				description: 'List the status changes recorded for a property',
				routing: {
					request: {
						method: 'GET',
						url: '=/properties/status/{{$parameter.propertyCode}}',
					},
					output: {
						postReceive: [splitNestedStatusHistory],
					},
				},
			},
			{
				name: 'Change Status',
				value: 'changeStatus',
				action: 'Change property status',
				description:
					'Change a property status. This is the only documented way to move a property through its lifecycle; created properties cannot be deleted.',
				routing: {
					request: {
						method: 'PUT',
						url: '=/properties/status/{{$parameter.propertyCode}}',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
						},
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'property',
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
	...propertyGetStatusHistoryDescription,
	...propertyChangeStatusDescription,
];

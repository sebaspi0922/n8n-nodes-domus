import type { INodeProperties } from 'n8n-workflow';
import { propertyChangeStatusDescription } from './changeStatus';
import { propertyCreateDescription } from './create';
import { propertyGetDescription } from './get';
import { propertyGetPortalPublicationsDescription } from './getPortalPublications';
import { propertyGetStatusHistoryDescription } from './getStatusHistory';
import { propertyRetryPortalPublicationDescription } from './retryPortalPublication';
import { propertySearchDescription } from './search';
import { splitNestedStatusHistory } from './statusHistory.helpers';
import { propertyUpdateDescription } from './update';

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
				name: 'Create',
				value: 'create',
				action: 'Create a property',
				description:
					'Create a property in the token agency. Created records cannot be deleted; only status can change.',
				routing: {
					request: {
						method: 'POST',
						url: '/properties',
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
			{
				name: 'Update',
				value: 'update',
				action: 'Update a property',
				description:
					'Update commercial fields of a property. Status cannot be changed here; use Change Status instead.',
				routing: {
					request: {
						method: 'PUT',
						url: '=/properties/{{$parameter.propertyCode}}',
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
				name: 'Get Portal Publications',
				value: 'getPortalPublications',
				action: 'Get property portal publications',
				description:
					'List the portals a property was published on, with their codes and sync dates',
				routing: {
					request: {
						method: 'GET',
						url: '=/properties/portals/{{$parameter.portalPropertyId}}{{$parameter.portalPropertyCode ? "/" + $parameter.portalPropertyCode : ""}}',
					},
				},
			},
			{
				name: 'Retry Portal Publication',
				value: 'retryPortalPublication',
				action: 'Retry a property portal publication',
				description:
					'Queue a failed portal publication, update, or unpublish again without editing the property',
				routing: {
					request: {
						method: 'GET',
						url: '=/properties/retry-portals/{{$parameter.propertyCode}}{{$parameter.retryPropertyId ? "/" + $parameter.retryPropertyId : ""}}',
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
	...propertyCreateDescription,
	...propertyUpdateDescription,
	...propertyGetStatusHistoryDescription,
	...propertyGetPortalPublicationsDescription,
	...propertyRetryPortalPublicationDescription,
	...propertyChangeStatusDescription,
];

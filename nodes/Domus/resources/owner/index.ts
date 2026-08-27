import type { INodeProperties } from 'n8n-workflow';
import { ownerCreateDescription } from './create';
import { ownerGetDescription } from './get';
import { ownerSearchDescription } from './search';
import { ownerUpdateDescription } from './update';

const showOnlyForOwners = {
	resource: ['owner'],
};

const formUrlEncoded = {
	'Content-Type': 'application/x-www-form-urlencoded',
};

export const ownerDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForOwners,
		},
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search owners',
				description: 'Search for owners and return each result as an n8n item',
				routing: {
					request: {
						method: 'GET',
						url: '/owners',
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
				action: 'Get an owner',
				description: 'Get an owner with their phones and associated properties',
				routing: {
					request: {
						method: 'GET',
						url: '=/owners/{{$parameter.ownerDocument}}',
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
				action: 'Create an owner',
				description: 'Create an owner and optionally associate them with a property',
				routing: {
					request: {
						method: 'POST',
						url: '/owners',
						headers: formUrlEncoded,
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
				action: 'Update an owner',
				description: 'Update an owner and optionally associate them with a property',
				routing: {
					request: {
						method: 'PUT',
						url: '=/owners/{{$parameter.ownerDocument}}',
						headers: formUrlEncoded,
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
	...ownerGetDescription,
	...ownerSearchDescription,
	...ownerCreateDescription,
	...ownerUpdateDescription,
];

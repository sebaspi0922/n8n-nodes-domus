import type { INodeProperties } from 'n8n-workflow';
import { DOMUS_CONTACTS_BASE_URL } from '../../constants';
import { contactCreateDescription, requireContactEmailOrPhone } from './create';
import { contactGetDescription } from './get';
import { contactSearchDescription } from './search';
import { contactUpdateDescription } from './update';

const showOnlyForContacts = {
	resource: ['contact'],
};

const contactsRequest = {
	baseURL: DOMUS_CONTACTS_BASE_URL,
};

export const contactDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForContacts,
		},
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search contacts',
				description: 'Search contacts and return each result as an n8n item',
				routing: {
					request: {
						...contactsRequest,
						method: 'GET',
						url: '/contacts',
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
				action: 'Get a contact',
				description: 'Get one contact by code. The response is a data array.',
				routing: {
					request: {
						...contactsRequest,
						method: 'GET',
						url: '=/contacts/{{$parameter.code}}',
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
				action: 'Create a contact',
				description:
					'Create a contact. Send the fields as form-urlencoded. The response object includes code.',
				routing: {
					request: {
						...contactsRequest,
						method: 'POST',
						url: '/contacts',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
						},
					},
					send: {
						preSend: [requireContactEmailOrPhone],
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a contact',
				description:
					'Update a contact by code. Send name, email, and description as form-urlencoded. The response object includes code.',
				routing: {
					request: {
						...contactsRequest,
						method: 'PUT',
						url: '=/contacts/{{$parameter.code}}',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
						},
					},
				},
			},
		],
		default: 'search',
	},
	...contactSearchDescription,
	...contactGetDescription,
	...contactCreateDescription,
	...contactUpdateDescription,
];

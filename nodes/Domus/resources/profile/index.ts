import type { INodeProperties } from 'n8n-workflow';
import { DOMUS_CRM_BASE_URL } from '../../constants';
import { profileSearchDescription } from './search';

const showOnlyForProfiles = {
	resource: ['profile'],
};

export const profileDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForProfiles,
		},
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search profiles',
				description: 'Search profiles and return each result as an n8n item',
				routing: {
					request: {
						baseURL: DOMUS_CRM_BASE_URL,
						method: 'GET',
						url: '/profiles',
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
	...profileSearchDescription,
];

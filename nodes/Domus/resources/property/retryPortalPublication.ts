import type { INodeProperties } from 'n8n-workflow';

const showOnlyForRetryPortalPublication = {
	operation: ['retryPortalPublication'],
	resource: ['property'],
};

export const propertyRetryPortalPublicationDescription: INodeProperties[] = [
	{
		displayName: 'Internal Property ID',
		name: 'retryPropertyId',
		type: 'string',
		default: '',
		placeholder: 'e.g. 3757787',
		description:
			'Internal Domus ID (idpro), used only when a property code needs a specific record',
		displayOptions: {
			show: showOnlyForRetryPortalPublication,
		},
	},
	{
		displayName: 'Transaction',
		name: 'retryMethod',
		type: 'options',
		required: true,
		default: '1',
		description: 'Portal transaction Domus should queue again',
		displayOptions: {
			show: showOnlyForRetryPortalPublication,
		},
		options: [
			{
				name: 'Create',
				value: '1',
				description: 'Retry publishing the property on its portals',
			},
			{
				name: 'Unpublish',
				value: '3',
				description: 'Retry removing the property from its portals',
			},
			{
				name: 'Update',
				value: '2',
				description: 'Retry sending the latest property data to its portals',
			},
		],
		routing: {
			send: {
				type: 'query',
				property: 'method',
			},
		},
	},
];

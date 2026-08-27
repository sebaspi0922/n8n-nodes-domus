import type { INodeProperties } from 'n8n-workflow';
import { createDomusLocator } from '../locators';

const showOnlyForOwnerGet = {
	operation: ['get'],
	resource: ['owner'],
};

const showOnlyForOwnerDocument = {
	operation: ['get', 'update'],
	resource: ['owner'],
};

export const ownerGetDescription: INodeProperties[] = [
	{
		displayName: 'Owner Document',
		name: 'ownerDocument',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 123456789',
		description:
			'Identification document of the owner. Send 0 when the document is unknown and identify the owner with Owner Code instead.',
		displayOptions: {
			show: showOnlyForOwnerDocument,
		},
	},
	{
		displayName: 'Entire Agency',
		name: 'ownerGetEntireAgency',
		type: 'boolean',
		default: false,
		description:
			'Whether to search the whole agency instead of only the branch associated with the token',
		displayOptions: {
			show: showOnlyForOwnerGet,
		},
		routing: {
			request: {
				headers: {
					Inmobiliaria: '={{ $value ? 1 : 0 }}',
				},
			},
		},
	},
	{
		displayName: 'Options',
		name: 'ownerGetOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: showOnlyForOwnerGet,
		},
		options: [
			{
				displayName: 'Owner Code',
				name: 'code',
				type: 'string',
				default: '',
				placeholder: 'e.g. 123',
				description: 'Domus owner code, used when the document is unknown',
				routing: {
					send: {
						type: 'query',
						property: 'code',
					},
				},
			},
			createDomusLocator({
				displayName: 'Property Status',
				name: 'propertyStatusCode',
				searchListMethod: 'searchStatuses',
				sendType: 'query',
				sendProperty: 'property_status_code',
				placeholder: 'e.g. 1,2',
				description:
					'Only return associated properties in this status; also accepts one or more comma-separated codes',
			}),
		],
	},
];

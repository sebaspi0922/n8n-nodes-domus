import type { INodeProperties } from 'n8n-workflow';

const showOnlyForPortalPublications = {
	operation: ['getPortalPublications'],
	resource: ['property'],
};

export const propertyGetPortalPublicationsDescription: INodeProperties[] = [
	{
		displayName: 'Internal Property ID',
		name: 'portalPropertyId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 3757787',
		description: 'Internal Domus ID (idpro) of the published property',
		displayOptions: {
			show: showOnlyForPortalPublications,
		},
	},
	{
		displayName: 'Property Code',
		name: 'portalPropertyCode',
		type: 'string',
		default: '',
		placeholder: 'e.g. 5580',
		description:
			'Property code (codpro), used only when the internal ID needs a specific record',
		displayOptions: {
			show: showOnlyForPortalPublications,
		},
	},
	{
		displayName: 'Entire Agency',
		name: 'portalEntireAgency',
		type: 'boolean',
		default: false,
		description:
			'Whether to look in the whole agency instead of only the branch associated with the token',
		displayOptions: {
			show: showOnlyForPortalPublications,
		},
		routing: {
			request: {
				headers: {
					Inmobiliaria: '={{ $value ? 1 : 0 }}',
				},
			},
		},
	},
];

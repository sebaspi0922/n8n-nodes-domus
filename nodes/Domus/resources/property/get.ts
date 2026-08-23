import type { INodeProperties } from 'n8n-workflow';

const showOnlyForPropertyGet = {
	operation: ['get'],
	resource: ['property'],
};

const showOnlyForPropertyCode = {
	operation: ['get', 'changeStatus', 'getStatusHistory', 'update'],
	resource: ['property'],
};

export const propertyGetDescription: INodeProperties[] = [
	{
		displayName: 'Property Code',
		name: 'propertyCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 5580',
		description: 'Property code in Domus (codpro)',
		displayOptions: {
			show: showOnlyForPropertyCode,
		},
	},
	{
		displayName: 'Internal Property ID',
		name: 'propertyId',
		type: 'string',
		default: '',
		placeholder: 'e.g. 3757787',
		description:
			'Internal Domus ID (idpro), used only when a property code needs a specific record',
		displayOptions: {
			show: showOnlyForPropertyGet,
		},
	},
	{
		displayName: 'Entire Agency',
		name: 'getEntireAgency',
		type: 'boolean',
		default: false,
		description:
			'Whether to search the whole agency instead of only the branch associated with the token',
		displayOptions: {
			show: showOnlyForPropertyGet,
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
		displayName: 'Include Property Sheet',
		name: 'getIncludeSheet',
		type: 'boolean',
		default: false,
		description: 'Whether to include the full property sheet in the response',
		displayOptions: {
			show: showOnlyForPropertyGet,
		},
		routing: {
			request: {
				headers: {
					Ficha: '={{ $value ? 1 : 0 }}',
				},
			},
		},
	},
	{
		displayName: 'Options',
		name: 'getOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: showOnlyForPropertyGet,
		},
		options: [
			{
				displayName: 'Include Owner',
				name: 'includeOwner',
				type: 'boolean',
				default: true,
				description:
					'Whether to include owner information when the token has the required permissions',
				routing: {
					request: {
						headers: {
							Propietario: '={{ $value ? 1 : 0 }}',
						},
					},
				},
			},
			{
				displayName: 'Map Zoom',
				name: 'mapZoom',
				type: 'number',
				default: 15,
				description: 'Zoom level used when requesting the property map image',
				routing: {
					request: {
						headers: {
							Mapa: '={{$value}}',
						},
					},
				},
			},
		],
	},
];

import type { INodeProperties } from 'n8n-workflow';

const showOnlyForPropertyGet = {
	operation: ['get'],
	resource: ['property'],
};

export const propertyGetDescription: INodeProperties[] = [
	{
		displayName: 'Código Del Inmueble',
		name: 'propertyCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Ej. 5580',
		description: 'Código del inmueble en Domus (codpro)',
		displayOptions: {
			show: showOnlyForPropertyGet,
		},
	},
	{
		displayName: 'ID Interno Del Inmueble',
		name: 'propertyId',
		type: 'string',
		default: '',
		placeholder: 'Ej. 3757787',
		description:
			'ID interno de Domus (idpro); úsalo únicamente para especificar un inmueble cuando sea necesario',
		displayOptions: {
			show: showOnlyForPropertyGet,
		},
	},
	{
		displayName: 'Toda La Inmobiliaria',
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
		displayName: 'Incluir Ficha',
		name: 'getIncludeSheet',
		type: 'boolean',
		default: false,
		description: 'Whether to request the property sheet from Domus',
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
		displayName: 'Opciones',
		name: 'getOptions',
		type: 'collection',
		placeholder: 'Añadir opción',
		default: {},
		displayOptions: {
			show: showOnlyForPropertyGet,
		},
		options: [
			{
				displayName: 'Incluir Propietario',
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
				displayName: 'Zoom Del Mapa',
				name: 'mapZoom',
				type: 'number',
				default: 15,
				description: 'Nivel de zoom usado para solicitar la imagen del mapa del inmueble',
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

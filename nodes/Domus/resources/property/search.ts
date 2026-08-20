import type { INodeProperties } from 'n8n-workflow';

const showOnlyForPropertySearch = {
	operation: ['search'],
	resource: ['property'],
};

export const propertySearchDescription: INodeProperties[] = [
	{
		displayName: 'Resultados Por Página',
		name: 'perPage',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 12,
		description: 'Cantidad de inmuebles solicitados en esta página',
		displayOptions: {
			show: showOnlyForPropertySearch,
		},
		routing: {
			request: {
				headers: {
					Perpage: '={{$value}}',
				},
			},
		},
	},
	{
		displayName: 'Página',
		name: 'page',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 1,
		description: 'Número de la página que se desea consultar',
		displayOptions: {
			show: showOnlyForPropertySearch,
		},
		routing: {
			send: {
				type: 'query',
				property: 'page',
			},
		},
	},
	{
		displayName: 'Toda La Inmobiliaria',
		name: 'entireAgency',
		type: 'boolean',
		default: false,
		description:
			'Whether to include properties from the whole agency instead of only the branch associated with the token',
		displayOptions: {
			show: showOnlyForPropertySearch,
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
		name: 'includeSheet',
		type: 'boolean',
		default: false,
		description: 'Whether to request the property sheet from Domus',
		displayOptions: {
			show: showOnlyForPropertySearch,
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
		displayName: 'Filtros',
		name: 'filters',
		type: 'collection',
		placeholder: 'Añadir filtro',
		default: {},
		displayOptions: {
			show: showOnlyForPropertySearch,
		},
		options: [
			{
				displayName: 'Barrio',
				name: 'neighborhood',
				type: 'string',
				default: '',
				description: 'Nombre o parte del nombre del barrio',
				routing: {
					send: {
						type: 'query',
						property: 'neighborhood',
					},
				},
			},
			{
				displayName: 'Ciudad',
				name: 'city',
				type: 'string',
				default: '',
				placeholder: 'Ej. 11001',
				description: 'Código de ciudad; permite varios códigos separados por comas',
				routing: {
					send: {
						type: 'query',
						property: 'city',
					},
				},
			},
			{
				displayName: 'Código De Barrio',
				name: 'neighborhoodCode',
				type: 'string',
				default: '',
				description: 'Código de barrio en Domus',
				routing: {
					send: {
						type: 'query',
						property: 'neighborhood_code',
					},
				},
			},
			{
				displayName: 'Código Del Inmueble',
				name: 'propertyCode',
				type: 'string',
				default: '',
				description: 'Código del inmueble en Domus',
				routing: {
					send: {
						type: 'query',
						property: 'codpro',
					},
				},
			},
			{
				displayName: 'Estrato',
				name: 'stratum',
				type: 'string',
				default: '',
				description: 'Estrato; permite varios valores separados por comas',
				routing: {
					send: {
						type: 'query',
						property: 'stratum',
					},
				},
			},
			{
				displayName: 'Gestión',
				name: 'businessType',
				type: 'string',
				default: '',
				placeholder: 'Ej. 2',
				description: 'Código de gestión; permite varios códigos separados por comas',
				routing: {
					send: {
						type: 'query',
						property: 'biz',
					},
				},
			},
			{
				displayName: 'Palabra Clave',
				name: 'keyword',
				type: 'string',
				default: '',
				description: 'Filtro general sobre distintos campos, como descripción y código',
				routing: {
					send: {
						type: 'query',
						property: 'keyword',
					},
				},
			},
			{
				displayName: 'Referencia',
				name: 'reference',
				type: 'string',
				default: '',
				description: 'Referencia del inmueble',
				routing: {
					send: {
						type: 'query',
						property: 'reference',
					},
				},
			},
			{
				displayName: 'Tipo De Inmueble',
				name: 'propertyType',
				type: 'string',
				default: '',
				placeholder: 'Ej. 5',
				description: 'Código de tipo de inmueble; permite varios códigos separados por comas',
				routing: {
					send: {
						type: 'query',
						property: 'type',
					},
				},
			},
		],
	},
];

import type {
	IDataObject,
	IN8nRequestOperationPaginationGeneric,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForPropertySearch = {
	operation: ['search'],
	resource: ['property'],
};

const showOnlyWhenReturningAll = {
	...showOnlyForPropertySearch,
	returnAll: [true],
};

const showOnlyWhenLimitingResults = {
	...showOnlyForPropertySearch,
	returnAll: [false],
};

const propertySearchQueryParameters = [
	'neighborhood',
	'city',
	'zone',
	'neighborhood_code',
	'codpro',
	'stratum',
	'biz',
	'keyword',
	'reference',
	'type',
] as const;

const paginationQuery = {
	...Object.fromEntries(
		propertySearchQueryParameters.map((parameter) => [
			parameter,
			`={{ $request.qs?.["${parameter}"] }}`,
		]),
	),
	page:
		'={{ $response.body?.current_page ? Number($response.body.current_page) + 1 : Number($request.qs?.page ?? 1) }}',
} as IDataObject;

const propertySearchPagination: IN8nRequestOperationPaginationGeneric = {
	type: 'generic',
	properties: {
		continue:
			'={{ Number($response.body?.current_page ?? 0) < Number($response.body?.last_page ?? 0) }}',
		request: {
			qs: paginationQuery,
		},
	},
};

interface DomusFilterLocatorConfig {
	description: string;
	displayName: string;
	loadOptionsDependsOn?: string[];
	name: string;
	placeholder: string;
	queryProperty: string;
	searchListMethod: string;
}

const createDomusFilterLocator = (config: DomusFilterLocatorConfig): INodeProperties => ({
	displayName: config.displayName,
	name: config.name,
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	description: config.description,
	typeOptions: config.loadOptionsDependsOn
		? { loadOptionsDependsOn: config.loadOptionsDependsOn }
		: undefined,
	modes: [
		{
			displayName: 'Desde Lista',
			name: 'list',
			type: 'list',
			placeholder: `Selecciona ${config.displayName.toLocaleLowerCase()}...`,
			typeOptions: {
				searchListMethod: config.searchListMethod,
				searchable: true,
			},
		},
		{
			displayName: 'Por Código',
			name: 'id',
			type: 'string',
			placeholder: config.placeholder,
		},
	],
	routing: {
		send: {
			type: 'query',
			property: config.queryProperty,
		},
	},
});

export const propertySearchDescription: INodeProperties[] = [
	{
		displayName: 'Devolver Todos',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: showOnlyForPropertySearch,
		},
		routing: {
			send: {
				paginate: '={{$value}}',
			},
			operations: {
				pagination: propertySearchPagination,
			},
		},
	},
	{
		displayName: 'Límite',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		required: true,
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: showOnlyWhenLimitingResults,
		},
		routing: {
			request: {
				headers: {
					Perpage: '={{$value}}',
				},
			},
			output: {
				maxResults: '={{$value}}',
			},
		},
	},
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
			show: showOnlyWhenReturningAll,
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
		description:
			'Página inicial; al devolver todos, la consulta continúa automáticamente hasta la última página',
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
			createDomusFilterLocator({
				displayName: 'Barrio',
				name: 'neighborhoodCode',
				searchListMethod: 'searchNeighborhoods',
				queryProperty: 'neighborhood_code',
				placeholder: 'Ej. 4174',
				description:
					'Barrio con inmuebles disponibles; también admite uno o varios códigos separados por comas',
				loadOptionsDependsOn: ['entireAgency', 'filters.city.value'],
			}),
			createDomusFilterLocator({
				displayName: 'Ciudad',
				name: 'city',
				searchListMethod: 'searchCities',
				queryProperty: 'city',
				placeholder: 'Ej. 76001',
				description:
					'Ciudad con inmuebles disponibles; también admite uno o varios códigos separados por comas',
				loadOptionsDependsOn: ['entireAgency'],
			}),
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
			createDomusFilterLocator({
				displayName: 'Gestión',
				name: 'businessType',
				searchListMethod: 'searchBusinessTypes',
				queryProperty: 'biz',
				placeholder: 'Ej. 2',
				description:
					'Gestión disponible, como venta o arriendo; también admite varios códigos separados por comas',
				loadOptionsDependsOn: ['entireAgency'],
			}),
			{
				displayName: 'Nombre Del Barrio',
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
			createDomusFilterLocator({
				displayName: 'Tipo De Inmueble',
				name: 'propertyType',
				searchListMethod: 'searchPropertyTypes',
				queryProperty: 'type',
				placeholder: 'Ej. 1',
				description:
					'Tipo de inmueble disponible; también admite uno o varios códigos separados por comas',
				loadOptionsDependsOn: ['entireAgency'],
			}),
			createDomusFilterLocator({
				displayName: 'Zona',
				name: 'zone',
				searchListMethod: 'searchZones',
				queryProperty: 'zone',
				placeholder: 'Ej. 2',
				description:
					'Zona con inmuebles disponibles; también admite uno o varios códigos separados por comas',
				loadOptionsDependsOn: ['entireAgency', 'filters.city.value'],
			}),
		],
	},
];

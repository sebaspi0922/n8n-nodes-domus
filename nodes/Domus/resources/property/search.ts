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
	page: '={{ $response.body?.current_page ? Number($response.body.current_page) + 1 : Number($request.qs?.page ?? 1) }}',
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
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: `Select ${config.displayName.toLocaleLowerCase()}...`,
			typeOptions: {
				searchListMethod: config.searchListMethod,
				searchable: true,
			},
		},
		{
			displayName: 'By Code',
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
		displayName: 'Return All',
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
		displayName: 'Limit',
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
		displayName: 'Results Per Page',
		name: 'perPage',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 12,
		description: 'Number of properties requested per page',
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
		displayName: 'Page',
		name: 'page',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 1,
		description:
			'Starting page; when returning all results, requests continue automatically through the last page',
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
		displayName: 'Entire Agency',
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
		displayName: 'Include Property Sheet',
		name: 'includeSheet',
		type: 'boolean',
		default: false,
		description: 'Whether to include the full property sheet in the response',
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
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: showOnlyForPropertySearch,
		},
		options: [
			createDomusFilterLocator({
				displayName: 'Business Type',
				name: 'businessType',
				searchListMethod: 'searchBusinessTypes',
				queryProperty: 'biz',
				placeholder: 'e.g. 2',
				description:
					'Available business type, such as sale or rental; also accepts comma-separated codes',
				loadOptionsDependsOn: ['entireAgency'],
			}),
			createDomusFilterLocator({
				displayName: 'City',
				name: 'city',
				searchListMethod: 'searchCities',
				queryProperty: 'city',
				placeholder: 'e.g. 76001',
				description:
					'City with available properties; also accepts one or more comma-separated codes',
				loadOptionsDependsOn: ['entireAgency'],
			}),
			{
				displayName: 'Keyword',
				name: 'keyword',
				type: 'string',
				default: '',
				description: 'General filter across fields such as description and property code',
				routing: {
					send: {
						type: 'query',
						property: 'keyword',
					},
				},
			},
			createDomusFilterLocator({
				displayName: 'Neighborhood',
				name: 'neighborhoodCode',
				searchListMethod: 'searchNeighborhoods',
				queryProperty: 'neighborhood_code',
				placeholder: 'e.g. 4174',
				description:
					'Neighborhood with available properties; also accepts one or more comma-separated codes',
				loadOptionsDependsOn: ['entireAgency', 'filters.city.value'],
			}),
			{
				displayName: 'Neighborhood Name',
				name: 'neighborhood',
				type: 'string',
				default: '',
				description: 'Full or partial neighborhood name',
				routing: {
					send: {
						type: 'query',
						property: 'neighborhood',
					},
				},
			},
			{
				displayName: 'Property Code',
				name: 'propertyCode',
				type: 'string',
				default: '',
				description: 'Property code in Domus',
				routing: {
					send: {
						type: 'query',
						property: 'codpro',
					},
				},
			},
			createDomusFilterLocator({
				displayName: 'Property Type',
				name: 'propertyType',
				searchListMethod: 'searchPropertyTypes',
				queryProperty: 'type',
				placeholder: 'e.g. 1',
				description: 'Available property type; also accepts one or more comma-separated codes',
				loadOptionsDependsOn: ['entireAgency'],
			}),
			{
				displayName: 'Reference',
				name: 'reference',
				type: 'string',
				default: '',
				description: 'Property reference',
				routing: {
					send: {
						type: 'query',
						property: 'reference',
					},
				},
			},
			{
				displayName: 'Stratum',
				name: 'stratum',
				type: 'string',
				default: '',
				description: 'Colombian socioeconomic stratum; accepts comma-separated values',
				routing: {
					send: {
						type: 'query',
						property: 'stratum',
					},
				},
			},
			createDomusFilterLocator({
				displayName: 'Zone',
				name: 'zone',
				searchListMethod: 'searchZones',
				queryProperty: 'zone',
				placeholder: 'e.g. 2',
				description:
					'Zone with available properties; also accepts one or more comma-separated codes',
				loadOptionsDependsOn: ['entireAgency', 'filters.city.value'],
			}),
		],
	},
];

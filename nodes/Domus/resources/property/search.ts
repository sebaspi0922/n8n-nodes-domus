import type {
	IDataObject,
	IN8nRequestOperationPaginationGeneric,
	INodeProperties,
} from 'n8n-workflow';
import { createDomusLocator } from './locators';

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
	'amenities',
	'amenitiesin',
	'branch',
	'broker',
	'biz',
	'city',
	'city_zone',
	'codpro',
	'keyword',
	'maxarea',
	'maxbath',
	'maxbed',
	'minarea',
	'minbath',
	'minbed',
	'multiple_codpro',
	'neighborhood',
	'neighborhood_code',
	'nostatus',
	'order',
	'pcmax',
	'pcmin',
	'pvmax',
	'pvmin',
	'reference',
	'sort',
	'status',
	'stratum',
	'type',
	'update',
	'zone',
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

const queryStringFilter = (
	displayName: string,
	name: string,
	property: string,
	description: string,
	placeholder?: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	description,
	placeholder,
	routing: {
		send: {
			type: 'query',
			property,
		},
	},
});

const queryNumberFilter = (
	displayName: string,
	name: string,
	property: string,
	description: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'number',
	default: 0,
	description,
	typeOptions: {
		minValue: 0,
	},
	routing: {
		send: {
			type: 'query',
			property,
		},
	},
});

const searchOrderOptions = [
	{ name: 'Administration', value: 'administration' },
	{ name: 'Address', value: 'address' },
	{ name: 'Bathrooms', value: 'bathrooms' },
	{ name: 'Bedrooms', value: 'bedrooms' },
	{ name: 'Built Area', value: 'area_cons' },
	{ name: 'Business Type', value: 'biz' },
	{ name: 'City Zone', value: 'city_zone' },
	{ name: 'Consignation Date', value: 'consignation_date' },
	{ name: 'Floor', value: 'floor' },
	{ name: 'Floor Type', value: 'floor_type' },
	{ name: 'Lot Area', value: 'area_lot' },
	{ name: 'Neighborhood', value: 'neighborhood' },
	{ name: 'Neighborhood Code', value: 'neighborhood_code' },
	{ name: 'Price High to Low', value: 'pricemax' },
	{ name: 'Price Low to High', value: 'pricemin' },
	{ name: 'Property Type', value: 'type' },
	{ name: 'Rent', value: 'rent' },
	{ name: 'Sale Price', value: 'saleprice' },
	{ name: 'Stratum', value: 'stratum' },
	{ name: 'Zone', value: 'zone' },
];

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
			createDomusLocator({
				displayName: 'Amenities',
				name: 'amenities',
				searchListMethod: 'searchAmenities',
				sendType: 'query',
				sendProperty: 'amenities',
				placeholder: 'e.g. 24,87,63',
				description:
					'Features the property should have; also accepts one or more comma-separated codes',
				loadOptionsDependsOn: ['filters.propertyType.value'],
			}),
			createDomusLocator({
				displayName: 'Amenities (Match All)',
				name: 'amenitiesIn',
				searchListMethod: 'searchAmenities',
				sendType: 'query',
				sendProperty: 'amenitiesin',
				placeholder: 'e.g. 24,87,63',
				description:
					'Features the property must include together (amenitiesin); also accepts comma-separated codes',
				loadOptionsDependsOn: ['filters.propertyType.value'],
			}),
			{
				displayName: 'Any Status',
				name: 'anyStatus',
				type: 'boolean',
				default: false,
				description:
					'Whether to return properties in every status (sends nostatus=0). Overrides a selected Status filter.',
				routing: {
					send: {
						type: 'query',
						property: 'nostatus',
						value: '={{ $value ? 0 : undefined }}',
					},
				},
			},
			createDomusLocator({
				displayName: 'Branch',
				name: 'branch',
				searchListMethod: 'searchBranches',
				sendType: 'query',
				sendProperty: 'branch',
				placeholder: 'e.g. 601',
				description:
					'Agency branch when the inventory spans more than one branch; also accepts comma-separated codes',
			}),
			createDomusLocator({
				displayName: 'Broker',
				name: 'broker',
				searchListMethod: 'searchBrokers',
				sendType: 'query',
				sendProperty: 'broker',
				placeholder: 'e.g. 1256',
				description:
					'Advisor responsible for the property; also accepts comma-separated codes',
			}),
			createDomusLocator({
				displayName: 'Business Type',
				name: 'businessType',
				searchListMethod: 'searchBusinessTypes',
				sendType: 'query',
				sendProperty: 'biz',
				placeholder: 'e.g. 2',
				description:
					'Available business type, such as sale or rental; also accepts comma-separated codes',
				loadOptionsDependsOn: ['entireAgency'],
			}),
			createDomusLocator({
				displayName: 'City',
				name: 'city',
				searchListMethod: 'searchCities',
				sendType: 'query',
				sendProperty: 'city',
				placeholder: 'e.g. 76001',
				description:
					'City with available properties; also accepts one or more comma-separated codes',
				loadOptionsDependsOn: ['entireAgency'],
			}),
			createDomusLocator({
				displayName: 'City Zone',
				name: 'cityZone',
				searchListMethod: 'searchCityZones',
				sendType: 'query',
				sendProperty: 'city_zone',
				placeholder: 'e.g. 1,2',
				description:
					'City-specific zone (locality); also accepts one or more comma-separated codes. This is not the same catalog as Zone.',
				loadOptionsDependsOn: ['filters.city.value'],
			}),
			queryStringFilter(
				'Keyword',
				'keyword',
				'keyword',
				'General filter across fields such as description and property code',
			),
			queryNumberFilter(
				'Max Bathrooms',
				'maxBathrooms',
				'maxbath',
				'Maximum number of bathrooms',
			),
			queryNumberFilter(
				'Max Bedrooms',
				'maxBedrooms',
				'maxbed',
				'Maximum number of bedrooms',
			),
			queryNumberFilter(
				'Max Built Area',
				'maxBuiltArea',
				'maxarea',
				'Maximum built area in square meters',
			),
			queryNumberFilter('Max Rent', 'maxRent', 'pcmax', 'Maximum rental price'),
			queryNumberFilter(
				'Max Sale Price',
				'maxSalePrice',
				'pvmax',
				'Maximum sale price',
			),
			queryNumberFilter(
				'Min Bathrooms',
				'minBathrooms',
				'minbath',
				'Minimum number of bathrooms',
			),
			queryNumberFilter(
				'Min Bedrooms',
				'minBedrooms',
				'minbed',
				'Minimum number of bedrooms',
			),
			queryNumberFilter(
				'Min Built Area',
				'minBuiltArea',
				'minarea',
				'Minimum built area in square meters',
			),
			queryNumberFilter('Min Rent', 'minRent', 'pcmin', 'Minimum rental price'),
			queryNumberFilter(
				'Min Sale Price',
				'minSalePrice',
				'pvmin',
				'Minimum sale price',
			),
			queryStringFilter(
				'Multiple Property Codes',
				'multiplePropertyCodes',
				'multiple_codpro',
				'Comma-separated property codes to fetch in one request',
				'e.g. 262,263',
			),
			createDomusLocator({
				displayName: 'Neighborhood',
				name: 'neighborhoodCode',
				searchListMethod: 'searchNeighborhoods',
				sendType: 'query',
				sendProperty: 'neighborhood_code',
				placeholder: 'e.g. 4174',
				description:
					'Neighborhood with available properties; also accepts one or more comma-separated codes',
				loadOptionsDependsOn: ['entireAgency', 'filters.city.value'],
			}),
			queryStringFilter(
				'Neighborhood Name',
				'neighborhood',
				'neighborhood',
				'Full or partial neighborhood name',
			),
			{
				displayName: 'Order By',
				name: 'order',
				type: 'options',
				default: 'saleprice',
				description:
					'Field used to sort results. Pair it with Sort Direction, except for Price Low to High / Price High to Low.',
				options: searchOrderOptions,
				routing: {
					send: {
						type: 'query',
						property: 'order',
					},
				},
			},
			queryStringFilter(
				'Property Code',
				'propertyCode',
				'codpro',
				'Property code in Domus',
			),
			createDomusLocator({
				displayName: 'Property Type',
				name: 'propertyType',
				searchListMethod: 'searchPropertyTypes',
				sendType: 'query',
				sendProperty: 'type',
				placeholder: 'e.g. 1',
				description: 'Available property type; also accepts one or more comma-separated codes',
				loadOptionsDependsOn: ['entireAgency'],
			}),
			queryStringFilter('Reference', 'reference', 'reference', 'Property reference'),
			{
				displayName: 'Sort Direction',
				name: 'sort',
				type: 'options',
				default: 'asc',
				description: 'Ascending or descending order for the selected Order By field',
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				routing: {
					send: {
						type: 'query',
						property: 'sort',
					},
				},
			},
			createDomusLocator({
				displayName: 'Status',
				name: 'status',
				searchListMethod: 'searchStatuses',
				sendType: 'query',
				sendProperty: 'status',
				placeholder: 'e.g. 1,3',
				description: 'Property status; also accepts one or more comma-separated codes',
			}),
			queryStringFilter(
				'Stratum',
				'stratum',
				'stratum',
				'Colombian socioeconomic stratum; accepts comma-separated values',
			),
			queryStringFilter(
				'Updated Since',
				'updatedSince',
				'update',
				'Only properties updated from this date through today, in YYYY-MM-DD',
				'e.g. 2022-12-19',
			),
			createDomusLocator({
				displayName: 'Zone',
				name: 'zone',
				searchListMethod: 'searchZones',
				sendType: 'query',
				sendProperty: 'zone',
				placeholder: 'e.g. 2',
				description:
					'Zone with available properties; also accepts one or more comma-separated codes',
				loadOptionsDependsOn: ['entireAgency', 'filters.city.value'],
			}),
		],
	},
];

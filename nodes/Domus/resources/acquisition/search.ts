import type { INodeProperties } from 'n8n-workflow';
import { createDomusLocator } from '../locators';
import { createDomusPagination } from '../pagination';

const showOnlyForAcquisitionSearch = {
	operation: ['search'],
	resource: ['acquisition'],
};

const showOnlyWhenReturningAll = {
	...showOnlyForAcquisitionSearch,
	returnAll: [true],
};

const showOnlyWhenLimitingResults = {
	...showOnlyForAcquisitionSearch,
	returnAll: [false],
};

const acquisitionSearchQueryParameters = [
	'administration_max',
	'administration_min',
	'biz',
	'branch',
	'broker',
	'city',
	'contact',
	'maxarea',
	'maxbath',
	'maxbed',
	'minarea',
	'minbath',
	'minbed',
	'neighborhood',
	'order',
	'price_max',
	'price_min',
	'sort',
	'stratum',
	'type',
] as const;

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

export const acquisitionSearchDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: showOnlyForAcquisitionSearch,
		},
		routing: {
			send: {
				paginate: '={{$value}}',
			},
			operations: {
				pagination: createDomusPagination(acquisitionSearchQueryParameters),
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
		description: 'Number of acquisitions requested per page',
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
			show: showOnlyForAcquisitionSearch,
		},
		routing: {
			send: {
				type: 'query',
				property: 'page',
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
			show: showOnlyForAcquisitionSearch,
		},
		options: [
			createDomusLocator({
				displayName: 'Advisor',
				name: 'broker',
				searchListMethod: 'searchBrokers',
				sendType: 'query',
				sendProperty: 'broker',
				placeholder: 'e.g. 1256',
				description: 'Advisor who captured the property',
			}),
			createDomusLocator({
				displayName: 'Branch',
				name: 'branch',
				searchListMethod: 'searchBranches',
				sendType: 'query',
				sendProperty: 'branch',
				placeholder: 'e.g. 601',
				description:
					'Branch the acquisition belongs to; also accepts one or more comma-separated codes',
			}),
			createDomusLocator({
				displayName: 'Business Type',
				name: 'businessType',
				searchListMethod: 'searchCatalogBusinessTypes',
				sendType: 'query',
				sendProperty: 'biz',
				placeholder: 'e.g. 1,2',
				description:
					'Business type of the acquisition; also accepts one or more comma-separated codes',
			}),
			createDomusLocator({
				displayName: 'City',
				name: 'city',
				searchListMethod: 'searchCatalogCities',
				sendType: 'query',
				sendProperty: 'city',
				placeholder: 'e.g. 11001,5001',
				description:
					'City of the acquisition; also accepts one or more comma-separated codes',
			}),
			queryStringFilter(
				'CRM Contact ID',
				'contact',
				'contact',
				'Identifier of the contact in Domus CRM',
				'e.g. 1256',
			),
			queryNumberFilter(
				'Max Administration',
				'maxAdministration',
				'administration_max',
				'Highest administration fee to include',
			),
			queryNumberFilter('Max Area', 'maxArea', 'maxarea', 'Largest area in m² to include'),
			queryNumberFilter(
				'Max Bathrooms',
				'maxBathrooms',
				'maxbath',
				'Highest number of bathrooms to include',
			),
			queryNumberFilter(
				'Max Bedrooms',
				'maxBedrooms',
				'maxbed',
				'Highest number of bedrooms to include',
			),
			queryNumberFilter('Max Value', 'maxValue', 'price_max', 'Highest capture value to include'),
			queryNumberFilter(
				'Min Administration',
				'minAdministration',
				'administration_min',
				'Lowest administration fee to include',
			),
			queryNumberFilter('Min Area', 'minArea', 'minarea', 'Smallest area in m² to include'),
			queryNumberFilter(
				'Min Bathrooms',
				'minBathrooms',
				'minbath',
				'Lowest number of bathrooms to include',
			),
			queryNumberFilter(
				'Min Bedrooms',
				'minBedrooms',
				'minbed',
				'Lowest number of bedrooms to include',
			),
			queryNumberFilter('Min Value', 'minValue', 'price_min', 'Lowest capture value to include'),
			queryStringFilter(
				'Neighborhood',
				'neighborhood',
				'neighborhood',
				'Neighborhood name or part of it',
			),
			{
				displayName: 'Order By',
				name: 'order',
				type: 'options',
				default: 'code',
				description: 'Field used to order the results',
				options: [
					{ name: 'Administration', value: 'administration' },
					{ name: 'Area', value: 'area' },
					{ name: 'Assigned Code', value: 'code' },
					{ name: 'Bathrooms', value: 'bathrooms' },
					{ name: 'Bedrooms', value: 'bedrooms' },
					{ name: 'City', value: 'city_code' },
					{ name: 'Neighborhood', value: 'neighborhood' },
					{ name: 'Property Type', value: 'type_code' },
					{ name: 'Stratum', value: 'stratum' },
					{ name: 'Unique Code', value: 'unique_code' },
					{ name: 'Value', value: 'price' },
				],
				routing: {
					send: {
						type: 'query',
						property: 'order',
					},
				},
			},
			createDomusLocator({
				displayName: 'Property Type',
				name: 'propertyType',
				searchListMethod: 'searchCatalogPropertyTypes',
				sendType: 'query',
				sendProperty: 'type',
				placeholder: 'e.g. 1,5',
				description:
					'Property type of the acquisition; also accepts one or more comma-separated codes',
			}),
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
			queryNumberFilter(
				'Stratum',
				'stratum',
				'stratum',
				'Colombian socioeconomic stratum of the acquisition',
			),
		],
	},
];

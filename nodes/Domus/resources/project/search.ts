import type { INodeProperties } from 'n8n-workflow';
import { createDomusLocator } from '../locators';
import { createDomusPagination } from '../pagination';

const showOnlyForProjectSearch = {
	operation: ['search'],
	resource: ['project'],
};

const showOnlyWhenReturningAll = {
	...showOnlyForProjectSearch,
	returnAll: [true],
};

const showOnlyWhenLimitingResults = {
	...showOnlyForProjectSearch,
	returnAll: [false],
};

const projectSearchQueryParameters = [
	'branch',
	'city',
	'code',
	'country',
	'name',
	'neighborhood',
	'nostatus',
	'order',
	'sort',
	'status',
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

export const projectSearchDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: showOnlyForProjectSearch,
		},
		routing: {
			send: {
				paginate: '={{$value}}',
			},
			operations: {
				pagination: createDomusPagination(projectSearchQueryParameters),
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
		description: 'Number of projects requested per page',
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
			show: showOnlyForProjectSearch,
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
			show: showOnlyForProjectSearch,
		},
		options: [
			{
				displayName: 'Any Status',
				name: 'anyStatus',
				type: 'boolean',
				default: false,
				description: 'Whether to return projects in every status instead of only active ones',
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
					'Branch the project belongs to; also accepts one or more comma-separated codes',
			}),
			createDomusLocator({
				displayName: 'City',
				name: 'city',
				searchListMethod: 'searchCatalogCities',
				sendType: 'query',
				sendProperty: 'city',
				placeholder: 'e.g. 11001,5001',
				description: 'City of the project; also accepts one or more comma-separated codes',
			}),
			createDomusLocator({
				displayName: 'Country',
				name: 'country',
				searchListMethod: 'searchCountries',
				sendType: 'query',
				sendProperty: 'country',
				placeholder: 'e.g. 1',
				description: 'Country of the project; also accepts one or more comma-separated codes',
			}),
			queryStringFilter('Name', 'name', 'name', 'Full project name or part of it'),
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
					{ name: 'Assigned Code', value: 'code' },
					{ name: 'City', value: 'city_code' },
					{ name: 'Maximum Area', value: 'max_area' },
					{ name: 'Minimum Area', value: 'min_area' },
					{ name: 'Neighborhood', value: 'neighborhood' },
					{ name: 'Stratum', value: 'stratum' },
					{ name: 'Unique Code', value: 'unique_code' },
				],
				routing: {
					send: {
						type: 'query',
						property: 'order',
					},
				},
			},
			queryStringFilter(
				'Project Code',
				'code',
				'code',
				'Code assigned to the project by the agency',
				'e.g. 123',
			),
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
				placeholder: 'e.g. 1,2,3',
				description:
					'Project status; also accepts one or more comma-separated codes',
			}),
		],
	},
];

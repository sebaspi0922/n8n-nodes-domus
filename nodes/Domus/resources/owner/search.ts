import type { INodeProperties } from 'n8n-workflow';
import { createDomusLocator } from '../locators';
import { createDomusPagination } from '../pagination';

const showOnlyForOwnerSearch = {
	operation: ['search'],
	resource: ['owner'],
};

const showOnlyWhenReturningAll = {
	...showOnlyForOwnerSearch,
	returnAll: [true],
};

const showOnlyWhenLimitingResults = {
	...showOnlyForOwnerSearch,
	returnAll: [false],
};

const ownerSearchQueryParameters = [
	'branch',
	'city',
	'codpro',
	'document',
	'email',
	'has_email',
	'has_properties',
	'name',
	'order',
	'phone',
	'precise_phone',
	'sort',
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

const queryFlagFilter = (
	displayName: string,
	name: string,
	property: string,
	description: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'boolean',
	default: false,
	description,
	routing: {
		send: {
			type: 'query',
			property,
			value: '={{ $value ? 1 : undefined }}',
		},
	},
});

export const ownerSearchDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: showOnlyForOwnerSearch,
		},
		routing: {
			send: {
				paginate: '={{$value}}',
			},
			operations: {
				pagination: createDomusPagination(ownerSearchQueryParameters),
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
		description: 'Number of owners requested per page',
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
			show: showOnlyForOwnerSearch,
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
			'Whether to include owners from the whole agency instead of only the branch associated with the token',
		displayOptions: {
			show: showOnlyForOwnerSearch,
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
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: showOnlyForOwnerSearch,
		},
		options: [
			createDomusLocator({
				displayName: 'Branch',
				name: 'branch',
				searchListMethod: 'searchBranches',
				sendType: 'query',
				sendProperty: 'branch',
				placeholder: 'e.g. 10',
				description: 'Branch the owner belongs to',
			}),
			createDomusLocator({
				displayName: 'City',
				name: 'city',
				searchListMethod: 'searchCatalogCities',
				sendType: 'query',
				sendProperty: 'city',
				placeholder: 'e.g. 11001,5001',
				description:
					'City the owner belongs to; also accepts one or more comma-separated codes',
			}),
			queryStringFilter(
				'Document',
				'document',
				'document',
				'Full identification document or part of it',
				'e.g. 123',
			),
			queryStringFilter('Email', 'email', 'email', 'Full email address or part of it'),
			queryStringFilter(
				'Exact Phone',
				'precisePhone',
				'precise_phone',
				'Exact landline or mobile number of the owner',
			),
			queryFlagFilter(
				'Has Email',
				'hasEmail',
				'has_email',
				'Whether to return only owners that have an email address',
			),
			queryFlagFilter(
				'Has Properties',
				'hasProperties',
				'has_properties',
				'Whether to return only owners linked to active properties',
			),
			queryStringFilter('Name', 'name', 'name', 'Full owner name or part of it'),
			{
				displayName: 'Order By',
				name: 'order',
				type: 'options',
				default: 'name',
				description: 'Field used to order the results',
				options: [
					{ name: 'Code', value: 'code' },
					{ name: 'First Name', value: 'name' },
					{ name: 'Last Name', value: 'last_name' },
				],
				routing: {
					send: {
						type: 'query',
						property: 'order',
					},
				},
			},
			queryStringFilter(
				'Phone',
				'phone',
				'phone',
				'Landline or mobile number of the owner, or part of it',
			),
			queryStringFilter(
				'Property Code',
				'codpro',
				'codpro',
				'Only owners linked to this property code',
				'e.g. 262',
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
		],
	},
];

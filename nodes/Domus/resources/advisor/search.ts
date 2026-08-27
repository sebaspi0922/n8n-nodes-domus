import type { INodeProperties } from 'n8n-workflow';
import { createDomusLocator } from '../locators';

const showOnlyForAdvisorSearch = {
	operation: ['search'],
	resource: ['advisor'],
};

const showOnlyWhenLimitingResults = {
	...showOnlyForAdvisorSearch,
	returnAll: [false],
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

export const advisorSearchDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: showOnlyForAdvisorSearch,
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
			output: {
				maxResults: '={{$value}}',
			},
		},
	},
	{
		displayName: 'Entire Agency',
		name: 'entireAgency',
		type: 'boolean',
		default: false,
		description:
			'Whether to include advisors from the whole agency instead of only the branch associated with the token',
		displayOptions: {
			show: showOnlyForAdvisorSearch,
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
			show: showOnlyForAdvisorSearch,
		},
		options: [
			createDomusLocator({
				displayName: 'Branch',
				name: 'branch',
				searchListMethod: 'searchBranches',
				sendType: 'query',
				sendProperty: 'branch',
				placeholder: 'e.g. 10,11',
				description:
					'Branch the advisor belongs to; also accepts one or more comma-separated codes',
			}),
			createDomusLocator({
				displayName: 'City',
				name: 'city',
				searchListMethod: 'searchCatalogCities',
				sendType: 'query',
				sendProperty: 'city',
				placeholder: 'e.g. 11001,5001',
				description:
					'City the advisor belongs to; also accepts one or more comma-separated codes',
			}),
			queryStringFilter('Email', 'email', 'email', 'Full email address or part of it'),
			queryStringFilter(
				'Exact Email',
				'exactEmail',
				'exact_email',
				'Complete email address of the advisor',
			),
			queryStringFilter('Name', 'name', 'name', 'Full advisor name or part of it'),
			{
				displayName: 'Order By',
				name: 'order',
				type: 'options',
				default: 'name',
				description: 'Field used to order the results',
				options: [
					{ name: 'Code', value: 'code' },
					{ name: 'Display Order', value: 'order' },
					{ name: 'Email', value: 'email' },
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
				'Landline or mobile number of the advisor, or part of it',
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

import type {
	IDataObject,
	IN8nRequestOperationPaginationGeneric,
	INodeProperties,
} from 'n8n-workflow';

const showOnlyForPropertyStatusHistory = {
	operation: ['getStatusHistory'],
	resource: ['property'],
};

const showOnlyWhenReturningAllHistory = {
	...showOnlyForPropertyStatusHistory,
	historyReturnAll: [true],
};

const showOnlyWhenLimitingHistory = {
	...showOnlyForPropertyStatusHistory,
	historyReturnAll: [false],
};

const historyPaginationQuery = {
	page: '={{ $response.body?.data?.current_page ? Number($response.body.data.current_page) + 1 : Number($request.qs?.page ?? 1) }}',
} as IDataObject;

const propertyStatusHistoryPagination: IN8nRequestOperationPaginationGeneric = {
	type: 'generic',
	properties: {
		continue:
			'={{ Number($response.body?.data?.current_page ?? 0) < Number($response.body?.data?.last_page ?? 0) }}',
		request: {
			qs: historyPaginationQuery,
		},
	},
};

export const propertyGetStatusHistoryDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'historyReturnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: showOnlyForPropertyStatusHistory,
		},
		routing: {
			send: {
				paginate: '={{$value}}',
			},
			operations: {
				pagination: propertyStatusHistoryPagination,
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'historyLimit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		required: true,
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: showOnlyWhenLimitingHistory,
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
		name: 'historyPerPage',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 12,
		description: 'Number of status changes requested per page',
		displayOptions: {
			show: showOnlyWhenReturningAllHistory,
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
		name: 'historyPage',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 1,
		description:
			'Starting page; when returning all results, requests continue automatically through the last page',
		displayOptions: {
			show: showOnlyForPropertyStatusHistory,
		},
		routing: {
			send: {
				type: 'query',
				property: 'page',
			},
		},
	},
];

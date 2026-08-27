import type { IDataObject, IN8nRequestOperationPaginationGeneric } from 'n8n-workflow';

/**
 * Domus paginates with a Laravel envelope: `current_page`, `last_page`, and a
 * `Perpage` header. Follow-up requests must repeat every filter, so each
 * documented query parameter is echoed back from the original request.
 */
export const createDomusPagination = (
	queryParameters: readonly string[],
): IN8nRequestOperationPaginationGeneric => ({
	type: 'generic',
	properties: {
		continue:
			'={{ Number($response.body?.current_page ?? 0) < Number($response.body?.last_page ?? 0) }}',
		request: {
			qs: {
				...Object.fromEntries(
					queryParameters.map((parameter) => [
						parameter,
						`={{ $request.qs?.["${parameter}"] }}`,
					]),
				),
				page: '={{ $response.body?.current_page ? Number($response.body.current_page) + 1 : Number($request.qs?.page ?? 1) }}',
			} as IDataObject,
		},
	},
});

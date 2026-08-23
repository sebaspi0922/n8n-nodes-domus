import type {
	IDataObject,
	IExecuteSingleFunctions,
	INodeExecutionData,
	IN8nHttpFullResponse,
} from 'n8n-workflow';

const isJsonObject = (value: unknown): value is IDataObject =>
	!!value && typeof value === 'object' && !Array.isArray(value);

const readHistoryRows = (body: unknown): IDataObject[] => {
	if (!isJsonObject(body)) return [];

	const envelope = body.data;
	if (Array.isArray(envelope)) {
		return envelope.filter(isJsonObject);
	}

	if (isJsonObject(envelope) && Array.isArray(envelope.data)) {
		return envelope.data.filter(isJsonObject);
	}

	return [];
};

export async function splitNestedStatusHistory(
	this: IExecuteSingleFunctions,
	_items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	return readHistoryRows(response.body).map((row) => ({ json: row }));
}

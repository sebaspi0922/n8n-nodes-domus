import type {
	IDataObject,
	IExecuteSingleFunctions,
	INodeExecutionData,
	IN8nHttpFullResponse,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

const isJsonObject = (value: unknown): value is IDataObject =>
	!!value && typeof value === 'object' && !Array.isArray(value);

/**
 * Domus CRM and the contacts API answer some auth failures with HTTP 200 and
 * `{ error, mensaje }` instead of a `data` array. n8n would otherwise turn the
 * missing array into one empty item.
 */
export async function rejectDomusErrorEnvelope(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const body = isJsonObject(response.body)
		? response.body
		: items.find((item) => isJsonObject(item.json))?.json;
	if (!isJsonObject(body) || Array.isArray(body.data)) return items;

	const code = body.error;
	const message = body.mensaje;
	const rejected =
		typeof message === 'string' &&
		message.trim() !== '' &&
		code !== undefined &&
		code !== null &&
		code !== 0 &&
		code !== '0';
	if (!rejected) return items;

	throw new NodeOperationError(this.getNode(), message.trim());
}

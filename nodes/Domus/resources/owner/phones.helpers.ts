import type { IDataObject, IExecuteSingleFunctions, IHttpRequestOptions } from 'n8n-workflow';

const isJsonObject = (value: unknown): value is IDataObject =>
	!!value && typeof value === 'object' && !Array.isArray(value);

const readEntryValue = (value: unknown): string => {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number') return String(value);
	if (isJsonObject(value) && 'value' in value) return readEntryValue(value.value);
	return '';
};

const readPhoneEntries = (value: unknown): IDataObject[] => {
	if (Array.isArray(value)) return value.filter(isJsonObject);
	if (isJsonObject(value) && Array.isArray(value.phone)) return value.phone.filter(isJsonObject);
	return [];
};

/**
 * Domus expects owner phones as a JSON string in a form-urlencoded field, for
 * example `[{"type":"1","number":"12356"}]`. The node collects them as a
 * fixed collection, so the request body has to be rewritten before it is sent.
 */
export async function serializeOwnerPhones(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = requestOptions.body;
	if (!isJsonObject(body)) return requestOptions;

	const phones = readPhoneEntries(body.phones)
		.map((entry) => ({
			type: readEntryValue(entry.type),
			number: readEntryValue(entry.number),
		}))
		.filter((entry) => entry.number.length > 0);

	if (phones.length === 0) {
		delete body.phones;
		return requestOptions;
	}

	body.phones = JSON.stringify(phones);
	return requestOptions;
}

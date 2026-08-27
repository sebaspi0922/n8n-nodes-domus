import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { searchPhoneTypes } from './listSearch';

export async function getPhoneTypes(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const { results } = await searchPhoneTypes.call(this);
	return results.map((result) => ({ name: result.name, value: result.value }));
}

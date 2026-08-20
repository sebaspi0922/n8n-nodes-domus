import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { DOMUS_CREDENTIAL_NAME } from '../constants';

interface DomusSearchOption {
	code: number | string;
	name: string;
	city_name?: string;
	state_name?: string;
}

interface DomusSearchResponse {
	data?: unknown;
}

const isDomusSearchOption = (value: unknown): value is DomusSearchOption => {
	if (!value || typeof value !== 'object') return false;

	const option = value as Partial<DomusSearchOption>;
	return (
		(typeof option.code === 'number' || typeof option.code === 'string') &&
		typeof option.name === 'string'
	);
};

const getFilterValue = (context: ILoadOptionsFunctions, name: string): string | undefined => {
	const filters = context.getCurrentNodeParameters()?.filters;
	if (!filters || typeof filters !== 'object' || Array.isArray(filters)) return undefined;

	const value = (filters as Record<string, unknown>)[name];
	if (typeof value === 'string' || typeof value === 'number') return String(value);

	if (value && typeof value === 'object' && 'value' in value) {
		const locatorValue = (value as { value?: unknown }).value;
		if (typeof locatorValue === 'string' || typeof locatorValue === 'number') {
			return String(locatorValue);
		}
	}

	return undefined;
};

const getDisplayName = (option: DomusSearchOption): string => {
	const location = option.city_name ?? option.state_name;
	return location && location.toLocaleLowerCase() !== option.name.toLocaleLowerCase()
		? `${option.name} — ${location}`
		: option.name;
};

async function searchDomusOptions(
	this: ILoadOptionsFunctions,
	endpoint: string,
	filter?: string,
	cityScoped = false,
): Promise<INodeListSearchResult> {
	const credentials = await this.getCredentials(DOMUS_CREDENTIAL_NAME);
	const entireAgency = this.getCurrentNodeParameter('entireAgency') === true;
	const city = cityScoped ? getFilterValue(this, 'city') : undefined;

	const response = (await this.helpers.httpRequestWithAuthentication.call(
		this,
		DOMUS_CREDENTIAL_NAME,
		{
			method: 'GET',
			baseURL: String(credentials.environment),
			url: endpoint,
			headers: {
				Accept: 'application/json',
				Inmobiliaria: entireAgency ? 1 : 0,
			},
			qs: city ? { city } : undefined,
		},
	)) as DomusSearchResponse;

	const normalizedFilter = filter?.trim().toLocaleLowerCase();
	const seenCodes = new Set<string>();
	const options = Array.isArray(response.data) ? response.data.filter(isDomusSearchOption) : [];

	const results = options
		.filter((option) => {
			const code = String(option.code);
			if (seenCodes.has(code)) return false;
			seenCodes.add(code);

			if (!normalizedFilter) return true;
			return [option.name, code, option.city_name, option.state_name].some((value) =>
				value?.toLocaleLowerCase().includes(normalizedFilter),
			);
		})
		.map((option) => ({
			name: getDisplayName(option),
			value: String(option.code),
		}))
		.sort((left, right) => left.name.localeCompare(right.name, 'es', { sensitivity: 'base' }));

	return { results };
}

export async function searchCities(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/search/cities', filter);
}

export async function searchPropertyTypes(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/search/types', filter);
}

export async function searchBusinessTypes(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/search/biz', filter);
}

export async function searchZones(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/search/zones', filter, true);
}

export async function searchNeighborhoods(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/search/neighborhoods', filter, true);
}

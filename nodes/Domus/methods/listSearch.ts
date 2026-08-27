import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { DOMUS_CREDENTIAL_NAME } from '../constants';

interface DomusSearchOption {
	code?: number | string;
	name: string;
	city_name?: string;
	last_name?: string;
	state_name?: string;
}

interface DomusSearchResponse {
	data?: unknown;
}

const isDomusSearchOption = (value: unknown): value is DomusSearchOption => {
	if (!value || typeof value !== 'object') return false;

	const option = value as Partial<DomusSearchOption>;
	const hasName = typeof option.name === 'string' && option.name.length > 0;
	const hasCode =
		option.code === undefined ||
		typeof option.code === 'number' ||
		typeof option.code === 'string';

	return hasName && hasCode;
};

const optionValue = (option: DomusSearchOption): string =>
	option.code !== undefined && String(option.code).length > 0 ? String(option.code) : option.name;

const extractLocatorValue = (value: unknown): string | undefined => {
	if (typeof value === 'string' || typeof value === 'number') return String(value);

	if (value && typeof value === 'object' && 'value' in value) {
		const locatorValue = (value as { value?: unknown }).value;
		if (typeof locatorValue === 'string' || typeof locatorValue === 'number') {
			return String(locatorValue);
		}
	}

	return undefined;
};

const getCollectionValue = (
	parameters: Record<string, unknown>,
	collectionName: string,
	name: string,
): string | undefined => {
	const collection = parameters[collectionName];
	if (!collection || typeof collection !== 'object' || Array.isArray(collection)) {
		return undefined;
	}

	return extractLocatorValue((collection as Record<string, unknown>)[name]);
};

const getFilterValue = (context: ILoadOptionsFunctions, name: string): string | undefined => {
	try {
		const fromParameter = extractLocatorValue(context.getCurrentNodeParameter(name));
		if (fromParameter) return fromParameter;
	} catch {
		// The parameter is absent on operations that do not declare it.
	}

	const parameters = (context.getCurrentNodeParameters() ?? {}) as Record<string, unknown>;
	const fromRoot = extractLocatorValue(parameters[name]);
	if (fromRoot) return fromRoot;

	for (const collectionName of ['filters', 'additionalFields', 'updateFields']) {
		const fromCollection = getCollectionValue(parameters, collectionName, name);
		if (fromCollection) return fromCollection;
	}

	return undefined;
};

const getFullName = (option: DomusSearchOption): string =>
	option.last_name ? `${option.name} ${option.last_name}`.trim() : option.name;

const getDisplayName = (option: DomusSearchOption): string => {
	const fullName = getFullName(option);
	const location = option.city_name ?? option.state_name;
	return location && location.toLocaleLowerCase() !== fullName.toLocaleLowerCase()
		? `${fullName} — ${location}`
		: fullName;
};

interface SearchDomusOptionsConfig {
	cityScoped?: boolean;
	includeAgencyScope?: boolean;
	nameFiltered?: boolean;
	typeScoped?: boolean;
}

async function searchDomusOptions(
	this: ILoadOptionsFunctions,
	endpoint: string,
	filter?: string,
	searchConfig: boolean | SearchDomusOptionsConfig = {},
): Promise<INodeListSearchResult> {
	const config = typeof searchConfig === 'boolean' ? { cityScoped: searchConfig } : searchConfig;
	const cityScoped = config.cityScoped ?? false;
	const includeAgencyScope = config.includeAgencyScope ?? true;
	const nameFiltered = config.nameFiltered ?? false;
	const typeScoped = config.typeScoped ?? false;
	const credentials = await this.getCredentials(DOMUS_CREDENTIAL_NAME);
	let entireAgency = false;
	try {
		entireAgency = this.getCurrentNodeParameter('entireAgency') === true;
	} catch {
		entireAgency = false;
	}
	const city = cityScoped ? getFilterValue(this, 'city') : undefined;
	const type = typeScoped ? getFilterValue(this, 'propertyType') : undefined;
	const name = nameFiltered ? filter?.trim() : undefined;
	const qs = {
		...(city ? { city } : {}),
		...(name ? { name } : {}),
		...(type ? { type } : {}),
	};

	const response = (await this.helpers.httpRequestWithAuthentication.call(
		this,
		DOMUS_CREDENTIAL_NAME,
		{
			method: 'GET',
			baseURL: String(credentials.environment),
			url: endpoint,
			headers: {
				Accept: 'application/json',
				...(includeAgencyScope ? { Inmobiliaria: entireAgency ? 1 : 0 } : {}),
			},
			qs: Object.keys(qs).length > 0 ? qs : undefined,
		},
	)) as DomusSearchResponse;

	const normalizedFilter = filter?.trim().toLocaleLowerCase();
	const seenValues = new Set<string>();
	const options = Array.isArray(response.data) ? response.data.filter(isDomusSearchOption) : [];

	const results = options
		.filter((option) => {
			const value = optionValue(option);
			if (seenValues.has(value)) return false;
			seenValues.add(value);

			if (!normalizedFilter) return true;
			return [
				option.name,
				option.last_name,
				getFullName(option),
				value,
				option.city_name,
				option.state_name,
			].some((candidate) => candidate?.toLocaleLowerCase().includes(normalizedFilter));
		})
		.map((option) => ({
			name: getDisplayName(option),
			value: optionValue(option),
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

export async function searchStatuses(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/general/status', filter, {
		includeAgencyScope: false,
	});
}

export async function searchSources(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/administrative/sources', filter, {
		includeAgencyScope: false,
	});
}

export async function searchBrokers(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/administrative/brokers', filter);
}

export async function searchBranches(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/administrative/branches', filter, {
		includeAgencyScope: false,
	});
}

export async function searchDocumentTypes(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/administrative/document_types', filter, {
		includeAgencyScope: false,
	});
}

export async function searchPhoneTypes(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/general/phone-types', filter, {
		includeAgencyScope: false,
	});
}

export async function searchAmenities(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/general/amenities', filter, {
		includeAgencyScope: false,
		typeScoped: true,
	});
}

export async function searchCityZones(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/general/city-zones', filter, {
		cityScoped: true,
		includeAgencyScope: false,
	});
}

export async function searchTypedNeighborhoods(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/search/digited-neighborhoods', filter, {
		cityScoped: true,
	});
}

export async function searchCatalogCities(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/general/cities', filter, {
		includeAgencyScope: false,
	});
}

export async function searchCatalogPropertyTypes(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/general/types', filter, {
		includeAgencyScope: false,
	});
}

export async function searchCatalogBusinessTypes(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/general/biz', filter, {
		includeAgencyScope: false,
	});
}

export async function searchCatalogZones(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/general/zones', filter, {
		includeAgencyScope: false,
	});
}

export async function searchCatalogNeighborhoods(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchDomusOptions.call(this, '/general/neighborhoods', filter, {
		cityScoped: true,
		includeAgencyScope: false,
		nameFiltered: true,
	});
}

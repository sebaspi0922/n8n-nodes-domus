import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { DOMUS_CRM_BASE_URL, DOMUS_CRM_CREDENTIAL_NAME } from '../constants';

interface CrmOption {
	code?: number | string;
	name: string;
	status?: number | string;
}

interface CrmListResponse {
	data?: unknown;
}

const isCrmOption = (value: unknown): value is CrmOption => {
	if (!value || typeof value !== 'object') return false;

	const option = value as Partial<CrmOption>;
	const hasName = typeof option.name === 'string' && option.name.length > 0;
	const hasCode =
		option.code === undefined || typeof option.code === 'number' || typeof option.code === 'string';

	return hasName && hasCode;
};

const optionValue = (option: CrmOption): string =>
	option.code !== undefined && String(option.code).length > 0 ? String(option.code) : option.name;

const extractId = (value: unknown): string | undefined => {
	if (typeof value === 'string' && value.trim().length > 0) return value.trim();
	if (typeof value === 'number' && Number.isFinite(value)) return String(value);

	if (value && typeof value === 'object' && 'value' in value) {
		return extractId((value as { value?: unknown }).value);
	}

	return undefined;
};

const readStatusId = (context: ILoadOptionsFunctions): string | undefined => {
	try {
		const current = extractId(context.getCurrentNodeParameter('status'));
		if (current) return current;
	} catch {
		// Search does not declare a status field. Results stay unfiltered.
	}

	const parameters = (context.getCurrentNodeParameters() ?? {}) as Record<string, unknown>;
	return extractId(parameters.status);
};

async function searchCrmOptions(
	this: ILoadOptionsFunctions,
	endpoint: string,
	filter?: string,
	statusScoped = false,
): Promise<INodeListSearchResult> {
	const status = statusScoped ? readStatusId(this) : undefined;
	const response = (await this.helpers.httpRequestWithAuthentication.call(
		this,
		DOMUS_CRM_CREDENTIAL_NAME,
		{
			method: 'GET',
			baseURL: DOMUS_CRM_BASE_URL,
			url: endpoint,
			headers: {
				Accept: 'application/json',
			},
			qs: status ? { status } : undefined,
		},
	)) as CrmListResponse;

	const normalizedFilter = filter?.trim().toLocaleLowerCase();
	const seenValues = new Set<string>();
	const options = Array.isArray(response.data) ? response.data.filter(isCrmOption) : [];

	const results = options
		.filter((option) => {
			const value = optionValue(option);
			if (seenValues.has(value)) return false;
			seenValues.add(value);

			if (status && option.status !== undefined && String(option.status) !== status) return false;
			if (!normalizedFilter) return true;

			return [option.name, value].some((candidate) =>
				candidate.toLocaleLowerCase().includes(normalizedFilter),
			);
		})
		.map((option) => ({
			name: option.name.trim(),
			value: optionValue(option),
		}))
		.sort((left, right) => left.name.localeCompare(right.name, 'es', { sensitivity: 'base' }));

	return { results };
}

export async function searchOpportunityStatuses(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchCrmOptions.call(this, '/opportunities/status', filter);
}

export async function searchMeetingTypes(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchCrmOptions.call(this, '/meetings/types', filter);
}

export async function searchMeetingStatuses(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchCrmOptions.call(this, '/meetings/status', filter);
}

export async function searchMeetingResults(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	return await searchCrmOptions.call(this, '/meetings/results', filter, true);
}

interface CrmProfile {
	code?: number | string;
	first_name?: string;
	last_name?: string;
}

const isCrmProfile = (value: unknown): value is CrmProfile => {
	if (!value || typeof value !== 'object') return false;

	const profile = value as CrmProfile;
	return (
		typeof profile.code === 'number' ||
		(typeof profile.code === 'string' && profile.code.length > 0)
	);
};

const profileLabel = (profile: CrmProfile): string =>
	[profile.first_name, profile.last_name]
		.filter((part): part is string => typeof part === 'string')
		.map((part) => part.trim())
		.filter((part) => part.length > 0)
		.join(' ');

export async function searchProfiles(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const response = (await this.helpers.httpRequestWithAuthentication.call(
		this,
		DOMUS_CRM_CREDENTIAL_NAME,
		{
			method: 'GET',
			baseURL: DOMUS_CRM_BASE_URL,
			url: '/profiles',
			headers: {
				Accept: 'application/json',
			},
		},
	)) as CrmListResponse;

	const normalizedFilter = filter?.trim().toLocaleLowerCase();
	const seenValues = new Set<string>();
	const profiles = Array.isArray(response.data) ? response.data.filter(isCrmProfile) : [];

	const results = profiles
		.map((profile) => ({
			name: profileLabel(profile),
			value: String(profile.code),
		}))
		.filter((option) => {
			if (option.name.length === 0 || seenValues.has(option.value)) return false;
			seenValues.add(option.value);
			if (!normalizedFilter) return true;

			return [option.name, option.value].some((candidate) =>
				candidate.toLocaleLowerCase().includes(normalizedFilter),
			);
		})
		.sort((left, right) => left.name.localeCompare(right.name, 'es', { sensitivity: 'base' }));

	return { results };
}

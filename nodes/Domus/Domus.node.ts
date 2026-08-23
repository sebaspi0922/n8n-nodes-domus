import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { DOMUS_BASE_URL_EXPRESSION, DOMUS_CREDENTIAL_NAME } from './constants';
import {
	searchAmenities,
	searchBusinessTypes,
	searchCatalogBusinessTypes,
	searchCatalogCities,
	searchCatalogNeighborhoods,
	searchCatalogPropertyTypes,
	searchCatalogZones,
	searchCities,
	searchCityZones,
	searchNeighborhoods,
	searchPropertyTypes,
	searchSources,
	searchStatuses,
	searchTypedNeighborhoods,
	searchZones,
} from './methods';
import { propertyDescription } from './resources/property';

export class Domus implements INodeType {
	methods = {
		listSearch: {
			searchAmenities,
			searchBusinessTypes,
			searchCatalogBusinessTypes,
			searchCatalogCities,
			searchCatalogNeighborhoods,
			searchCatalogPropertyTypes,
			searchCatalogZones,
			searchCities,
			searchCityZones,
			searchNeighborhoods,
			searchPropertyTypes,
			searchSources,
			searchStatuses,
			searchTypedNeighborhoods,
			searchZones,
		},
	};

	description: INodeTypeDescription = {
		displayName: 'Domus',
		name: 'domus',
		icon: {
			light: 'file:domus.svg',
			dark: 'file:domus.dark.svg',
		},
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Interact with Domus CRM using Domus API 3.0',
		defaults: {
			name: 'Domus',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: DOMUS_CREDENTIAL_NAME, required: true }],
		requestDefaults: {
			baseURL: DOMUS_BASE_URL_EXPRESSION,
			headers: {
				Accept: 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Property',
						value: 'property',
					},
				],
				default: 'property',
			},
			...propertyDescription,
		],
	};
}

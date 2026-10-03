import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import {
	DOMUS_API_RESOURCES,
	DOMUS_BASE_URL_EXPRESSION,
	DOMUS_CREDENTIAL_NAME,
	DOMUS_CRM_CREDENTIAL_NAME,
	DOMUS_CRM_RESOURCES,
} from './constants';
import {
	getPhoneTypes,
	searchAmenities,
	searchBranches,
	searchBrokers,
	searchBusinessTypes,
	searchCatalogBusinessTypes,
	searchCatalogCities,
	searchCatalogNeighborhoods,
	searchCatalogPropertyTypes,
	searchCatalogZones,
	searchCities,
	searchCityZones,
	searchCountries,
	searchDestinations,
	searchDetachStatuses,
	searchDocumentTypes,
	searchExtraAmenities,
	searchNeighborhoods,
	searchPhoneTypes,
	searchPopulatedCenters,
	searchPropertyTypes,
	searchSources,
	searchStates,
	searchStatuses,
	searchTypedNeighborhoods,
	searchZones,
	searchMeetingResults,
	searchMeetingStatuses,
	searchMeetingTypes,
	searchOpportunityStatuses,
	searchProfiles,
} from './methods';
import { acquisitionDescription } from './resources/acquisition';
import { contactDescription } from './resources/contact';
import { meetingDescription } from './resources/meeting';
import { opportunityDescription } from './resources/opportunity';
import { profileDescription } from './resources/profile';
import { advisorDescription } from './resources/advisor';
import { branchDescription } from './resources/branch';
import { ownerDescription } from './resources/owner';
import { projectDescription } from './resources/project';
import { propertyDescription } from './resources/property';

export class Domus implements INodeType {
	methods = {
		listSearch: {
			searchAmenities,
			searchBranches,
			searchBrokers,
			searchBusinessTypes,
			searchCatalogBusinessTypes,
			searchCatalogCities,
			searchCatalogNeighborhoods,
			searchCatalogPropertyTypes,
			searchCatalogZones,
			searchCities,
			searchCityZones,
			searchCountries,
			searchDestinations,
			searchDetachStatuses,
			searchDocumentTypes,
			searchExtraAmenities,
			searchNeighborhoods,
			searchPhoneTypes,
			searchPopulatedCenters,
			searchPropertyTypes,
			searchSources,
			searchStates,
			searchStatuses,
			searchTypedNeighborhoods,
			searchZones,
			searchMeetingResults,
			searchMeetingStatuses,
			searchMeetingTypes,
			searchOpportunityStatuses,
			searchProfiles,
		},
		loadOptions: {
			getPhoneTypes,
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
		version: [1, 2],
		defaultVersion: 2,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description:
			'Interact with Domus properties, owners, meetings, opportunities, profiles, and contacts',
		defaults: {
			name: 'Domus',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: DOMUS_CREDENTIAL_NAME,
				required: true,
				displayOptions: {
					show: {
						resource: DOMUS_API_RESOURCES,
						authentication: [DOMUS_CREDENTIAL_NAME],
					},
				},
			},
			{
				name: DOMUS_CRM_CREDENTIAL_NAME,
				required: true,
				displayOptions: {
					show: {
						resource: DOMUS_CRM_RESOURCES,
						authentication: [DOMUS_CRM_CREDENTIAL_NAME],
					},
				},
			},
		],
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
						name: 'Acquisition',
						value: 'acquisition',
					},
					{
						name: 'Advisor',
						value: 'advisor',
					},
					{
						name: 'Branch',
						value: 'branch',
					},
					{
						name: 'Contact',
						value: 'contact',
					},
					{
						name: 'Meeting',
						value: 'meeting',
					},
					{
						name: 'Opportunity',
						value: 'opportunity',
					},
					{
						name: 'Owner',
						value: 'owner',
					},
					{
						name: 'Profile',
						value: 'profile',
					},
					{
						name: 'Project',
						value: 'project',
					},
					{
						name: 'Property',
						value: 'property',
					},
				],
				default: 'property',
			},
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'hidden',
				default:
					'={{["contact", "meeting", "opportunity", "profile"].includes($parameter["resource"]) ? "domusCrmApi" : "domusApi"}}',
			},
			...propertyDescription,
			...ownerDescription,
			...advisorDescription,
			...branchDescription,
			...projectDescription,
			...acquisitionDescription,
			...meetingDescription,
			...opportunityDescription,
			...profileDescription,
			...contactDescription,
		],
	};
}

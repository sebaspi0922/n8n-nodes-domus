import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { DOMUS_CRM_BASE_URL, DOMUS_CRM_CREDENTIAL_NAME } from './constants';
import {
	searchMeetingResults,
	searchMeetingStatuses,
	searchMeetingTypes,
	searchOpportunityStatuses,
	searchProfiles,
} from './methods';
import { contactDescription } from './resources/contact';
import { meetingDescription } from './resources/meeting';
import { opportunityDescription } from './resources/opportunity';
import { profileDescription } from './resources/profile';

export class DomusCrm implements INodeType {
	methods = {
		listSearch: {
			searchMeetingResults,
			searchMeetingStatuses,
			searchMeetingTypes,
			searchOpportunityStatuses,
			searchProfiles,
		},
	};

	description: INodeTypeDescription = {
		displayName: 'Domus CRM',
		name: 'domusCrm',
		icon: {
			light: 'file:../Domus/domus.svg',
			dark: 'file:../Domus/domus.dark.svg',
		},
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description:
			'Read and write meetings, opportunities, and contacts, and search profiles in the Domus CRM API',
		defaults: {
			name: 'Domus CRM',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: DOMUS_CRM_CREDENTIAL_NAME, required: true }],
		requestDefaults: {
			baseURL: DOMUS_CRM_BASE_URL,
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
						name: 'Meeting',
						value: 'meeting',
					},
					{
						name: 'Opportunity',
						value: 'opportunity',
					},
					{
						name: 'Profile',
						value: 'profile',
					},
					{
						name: 'Contact',
						value: 'contact',
					},
				],
				default: 'meeting',
			},
			...meetingDescription,
			...opportunityDescription,
			...profileDescription,
			...contactDescription,
		],
	};
}

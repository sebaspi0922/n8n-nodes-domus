import type { INodeProperties } from 'n8n-workflow';
import { advisorWriteFields } from './writeFields';

const showOnlyForAdvisorUpdate = {
	operation: ['update'],
	resource: ['advisor'],
};

export const advisorUpdateDescription: INodeProperties[] = [
	{
		displayName:
			'There is no documented get-by-ID for an advisor. Send only the fields that should change. The code in the URL identifies the advisor.',
		name: 'advisorUpdateNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: showOnlyForAdvisorUpdate,
		},
	},
	{
		displayName: 'Advisor Code',
		name: 'advisorCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 1234',
		description: 'Advisor code returned by Advisor Search',
		displayOptions: {
			show: showOnlyForAdvisorUpdate,
		},
	},
	{
		displayName: 'Update Fields',
		name: 'advisorUpdateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForAdvisorUpdate,
		},
		options: advisorWriteFields({
			includeIdentity: true,
			includeStatus: true,
		}),
	},
];

import type { INodeProperties } from 'n8n-workflow';
import { ownerWriteFields } from './writeFields';

const showOnlyForOwnerUpdate = {
	operation: ['update'],
	resource: ['owner'],
};

export const ownerUpdateDescription: INodeProperties[] = [
	{
		displayName:
			'Domus identifies the owner by the number in the URL. Sending a Document field also rewrites the stored document.',
		name: 'ownerUpdateNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: showOnlyForOwnerUpdate,
		},
	},
	{
		displayName: 'Update Fields',
		name: 'ownerUpdateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForOwnerUpdate,
		},
		options: ownerWriteFields({
			includeIdentity: true,
			includePhonesRecursive: true,
		}),
	},
];

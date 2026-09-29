import type { INodeProperties } from 'n8n-workflow';

const showOnlyForOwnerUnlink = {
	operation: ['unlink'],
	resource: ['owner'],
};

export const ownerUnlinkDescription: INodeProperties[] = [
	{
		displayName:
			'This removes the association between the owner and the property. The owner record stays in Domus.',
		name: 'unlinkNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: showOnlyForOwnerUnlink,
		},
	},
	{
		displayName: 'Owner Code',
		name: 'ownerCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 123',
		description: 'Unique owner code (owner_code), not the identification document',
		displayOptions: {
			show: showOnlyForOwnerUnlink,
		},
	},
	{
		displayName: 'Property Code',
		name: 'linkedPropertyCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 456',
		description: 'Property code (codpro) to detach from this owner',
		displayOptions: {
			show: showOnlyForOwnerUnlink,
		},
	},
	{
		displayName: 'Entire Agency',
		name: 'unlinkEntireAgency',
		type: 'boolean',
		default: false,
		description:
			'Whether to look across the whole agency instead of only the branch associated with the token',
		displayOptions: {
			show: showOnlyForOwnerUnlink,
		},
		routing: {
			request: {
				headers: {
					Inmobiliaria: '={{ $value ? 1 : 0 }}',
				},
			},
		},
	},
];

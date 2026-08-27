import type { INodeProperties } from 'n8n-workflow';
import { ownerWriteFields } from './writeFields';

const showOnlyForOwnerCreate = {
	operation: ['create'],
	resource: ['owner'],
};

const requiredCreateField = (
	displayName: string,
	name: string,
	property: string,
	description: string,
	placeholder?: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	required: true,
	default: '',
	description,
	placeholder,
	displayOptions: {
		show: showOnlyForOwnerCreate,
	},
	routing: {
		send: {
			type: 'body',
			property,
		},
	},
});

export const ownerCreateDescription: INodeProperties[] = [
	requiredCreateField('First Name', 'name', 'name', 'Owner given names', 'e.g. Ana'),
	requiredCreateField('Last Name', 'lastName', 'last_name', 'Owner family names', 'e.g. Restrepo'),
	requiredCreateField(
		'Document',
		'document',
		'document',
		'Identification document number of the owner',
		'e.g. 123456789',
	),
	{
		displayName: 'Additional Fields',
		name: 'ownerFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForOwnerCreate,
		},
		options: ownerWriteFields(),
	},
];

import type { INodeProperties } from 'n8n-workflow';
import { advisorWriteFields } from './writeFields';

const showOnlyForAdvisorCreate = {
	operation: ['create'],
	resource: ['advisor'],
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
		show: showOnlyForAdvisorCreate,
	},
	routing: {
		send: {
			type: 'body',
			property,
		},
	},
});

export const advisorCreateDescription: INodeProperties[] = [
	requiredCreateField('First Name', 'name', 'name', 'Advisor given names', 'e.g. Ana'),
	requiredCreateField('Last Name', 'lastName', 'last_name', 'Advisor family names', 'e.g. Restrepo'),
	requiredCreateField(
		'Document',
		'document',
		'document',
		'Identification document number of the advisor',
		'e.g. 123456',
	),
	{
		displayName: 'Additional Fields',
		name: 'advisorFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForAdvisorCreate,
		},
		options: advisorWriteFields(),
	},
];

import type { INodeProperties } from 'n8n-workflow';
import { propertyWriteFields } from './writeFields';

const showOnlyForPropertyUpdate = {
	operation: ['update'],
	resource: ['property'],
};

export const propertyUpdateDescription: INodeProperties[] = [
	{
		displayName:
			'Status cannot be changed here. Use Change Status for lifecycle updates. Created properties cannot be deleted.',
		name: 'updateNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: showOnlyForPropertyUpdate,
		},
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForPropertyUpdate,
		},
		options: propertyWriteFields({
			cityDependsOn: ['updateFields.city.value'],
			includeAddress: true,
			includeBusinessType: true,
			includeCity: true,
			includeDeletePictures: true,
			includeNeighborhoodCode: true,
			includePrices: true,
			includePropertyType: true,
			typeDependsOn: ['updateFields.propertyType.value'],
		}),
	},
];

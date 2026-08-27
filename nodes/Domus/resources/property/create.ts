import type { INodeProperties } from 'n8n-workflow';
import { createDomusLocator } from '../locators';
import { omitEmptyNumberExpression, propertyWriteFields } from './writeFields';

const showOnlyForPropertyCreate = {
	operation: ['create'],
	resource: ['property'],
};

export const propertyCreateDescription: INodeProperties[] = [
	{
		displayName:
			'Created properties cannot be deleted. Use Change Status to take a listing out of inventory. Prefer the testing host unless you intend to create a live property.',
		name: 'createNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: showOnlyForPropertyCreate,
		},
	},
	createDomusLocator({
		displayName: 'City',
		name: 'city',
		searchListMethod: 'searchCatalogCities',
		sendType: 'body',
		sendProperty: 'city',
		placeholder: 'e.g. 11001',
		required: true,
		description:
			'City where the property is located. Uses the full Domus city catalog, not only cities that already have inventory.',
		displayOptions: {
			show: showOnlyForPropertyCreate,
		},
	}),
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. Calle 123 #45-67',
		description: 'Property street address',
		displayOptions: {
			show: showOnlyForPropertyCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'address',
			},
		},
	},
	createDomusLocator({
		displayName: 'Business Type',
		name: 'businessType',
		searchListMethod: 'searchCatalogBusinessTypes',
		sendType: 'body',
		sendProperty: 'biz',
		placeholder: 'e.g. 2',
		required: true,
		description:
			'Business type. Rent is required when biz is 1 or 3; sale price is required when biz is 2 or 3.',
		displayOptions: {
			show: showOnlyForPropertyCreate,
		},
	}),
	createDomusLocator({
		displayName: 'Property Type',
		name: 'propertyType',
		searchListMethod: 'searchCatalogPropertyTypes',
		sendType: 'body',
		sendProperty: 'type',
		placeholder: 'e.g. 5',
		required: true,
		description:
			'Property type from the full catalog. Some types also require built area, lot area, bedrooms, or bathrooms.',
		displayOptions: {
			show: showOnlyForPropertyCreate,
		},
	}),
	createDomusLocator({
		displayName: 'Neighborhood',
		name: 'neighborhoodCode',
		searchListMethod: 'searchCatalogNeighborhoods',
		sendType: 'body',
		sendProperty: 'neighborhood_code',
		placeholder: 'e.g. 4751',
		description:
			'Catalog neighborhood. Required if you do not send a typed Neighborhood Name in Additional Fields. Scoped to the selected city.',
		displayOptions: {
			show: showOnlyForPropertyCreate,
		},
		loadOptionsDependsOn: ['city.value'],
	}),
	{
		displayName: 'Rent',
		name: 'rent',
		type: 'number',
		default: 0,
		description: 'Rental price. Required by Domus when Business Type is 1 (rent) or 3 (rent and sale).',
		displayOptions: {
			show: showOnlyForPropertyCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'rent',
				value: omitEmptyNumberExpression,
			},
		},
	},
	{
		displayName: 'Sale Price',
		name: 'salePrice',
		type: 'number',
		default: 0,
		description: 'Sale price. Required by Domus when Business Type is 2 (sale) or 3 (rent and sale).',
		displayOptions: {
			show: showOnlyForPropertyCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'saleprice',
				value: omitEmptyNumberExpression,
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForPropertyCreate,
		},
		options: propertyWriteFields({
			cityDependsOn: ['city.value'],
			includePropertyCode: true,
			includeStatus: true,
			typeDependsOn: ['propertyType.value'],
		}),
	},
];

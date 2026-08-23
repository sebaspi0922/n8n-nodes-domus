import type { INodeProperties } from 'n8n-workflow';
import { createDomusLocator } from './locators';

interface PropertyWriteFieldOptions {
	cityDependsOn?: string[];
	includeAddress?: boolean;
	includeBusinessType?: boolean;
	includeCity?: boolean;
	includeDeletePictures?: boolean;
	includeNeighborhoodCode?: boolean;
	includePrices?: boolean;
	includePropertyCode?: boolean;
	includePropertyType?: boolean;
	includeStatus?: boolean;
	typeDependsOn?: string[];
}

const omitEmptyNumber = '={{ $value ? $value : undefined }}';

const bodyStringField = (
	displayName: string,
	name: string,
	property: string,
	description: string,
	placeholder?: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	description,
	placeholder,
	routing: {
		send: {
			type: 'body',
			property,
		},
	},
});

const bodyNumberField = (
	displayName: string,
	name: string,
	property: string,
	description: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'number',
	default: 0,
	description,
	routing: {
		send: {
			type: 'body',
			property,
		},
	},
});

const bodyBooleanField = (
	displayName: string,
	name: string,
	property: string,
	description: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'boolean',
	default: false,
	description,
	routing: {
		send: {
			type: 'body',
			property,
			value: '={{ $value ? 1 : 0 }}',
		},
	},
});

export const propertyWriteFields = (
	options: PropertyWriteFieldOptions = {},
): INodeProperties[] => {
	const cityDependsOn = options.cityDependsOn ?? ['city.value'];
	const typeDependsOn = options.typeDependsOn ?? ['propertyType.value'];
	const fields: INodeProperties[] = [
		bodyNumberField(
			'Administration',
			'administration',
			'administration',
			'Monthly administration fee',
		),
		createDomusLocator({
			displayName: 'Amenities',
			name: 'amenities',
			searchListMethod: 'searchAmenities',
			sendType: 'body',
			sendProperty: 'amenities',
			placeholder: 'e.g. 24,87,63',
			description:
				'Property features; also accepts one or more comma-separated codes. Scoped to the selected property type when possible.',
			loadOptionsDependsOn: typeDependsOn,
		}),
		bodyNumberField('Bathrooms', 'bathrooms', 'bathrooms', 'Number of bathrooms'),
		bodyNumberField('Bedrooms', 'bedrooms', 'bedrooms', 'Number of bedrooms'),
		bodyStringField(
			'Branch Code',
			'branch',
			'branch',
			'Agency branch that owns the listing',
			'e.g. 601',
		),
		bodyStringField(
			'Broker Code',
			'broker',
			'broker',
			'Advisor assigned to the property',
			'e.g. 1256',
		),
		bodyNumberField(
			'Built Area',
			'builtArea',
			'area_cons',
			'Built area in square meters. Required by Domus for some property types.',
		),
		bodyNumberField('Built Year', 'builtYear', 'built_year', 'Year the property was built'),
		bodyStringField(
			'Catcher Broker',
			'catcherBroker',
			'catcher_broker',
			'Advisor who captured the listing. Defaults to Broker when omitted.',
		),
		createDomusLocator({
			displayName: 'City Zone',
			name: 'cityZone',
			searchListMethod: 'searchCityZones',
			sendType: 'body',
			sendProperty: 'city_zone',
			placeholder: 'e.g. 3',
			description:
				'City-specific zone or locality. Required by Domus if Zone is not sent. This is not the same catalog as Zone.',
			loadOptionsDependsOn: cityDependsOn,
		}),
		bodyStringField('Comment', 'comment', 'comment', 'Internal comment stored on the property'),
		bodyNumberField(
			'Commission Percentage',
			'commissionPercentage',
			'comission_percentage',
			'Commission percentage (Domus field comission_percentage)',
		),
		bodyStringField(
			'Consignation Date',
			'consignationDate',
			'consignation_date',
			'Consignation date in Domus format YYYY-MM-DD HH:mm:ss',
			'e.g. 2020-03-30 11:10:00',
		),
		bodyStringField('Description', 'description', 'description', 'Property description'),
		bodyStringField(
			'Destination',
			'destination',
			'destination',
			'Property destination code',
			'e.g. 2',
		),
		bodyBooleanField('Exclusive', 'exclusive', 'exclusive', 'Whether the listing is exclusive'),
		bodyBooleanField('Featured', 'featured', 'great', 'Whether the listing is featured (great)'),
		bodyNumberField('Floor', 'floor', 'floor', 'Floor where the property is located'),
		bodyStringField('Floor Type', 'floorType', 'floor_type', 'Floor finish', 'e.g. ceramica'),
		bodyNumberField('IVA', 'iva', 'iva', 'VAT percentage'),
		bodyStringField('Latitude', 'latitude', 'latitude', 'Latitude'),
		bodyNumberField('Levels', 'levels', 'level', 'Number of floors in the building or property'),
		bodyStringField(
			'Link Web',
			'linkWeb',
			'link_web',
			'Public listing URL',
			'e.g. https://...',
		),
		bodyStringField('Longitude', 'longitude', 'longitude', 'Longitude'),
		bodyNumberField(
			'Lot Area',
			'lotArea',
			'area_lot',
			'Lot area in square meters. Required by Domus for some property types.',
		),
		bodyStringField(
			'Neighborhood Name',
			'neighborhood',
			'neighborhood',
			'Typed neighborhood name. Required by Domus if Neighborhood is not sent.',
		),
		bodyNumberField('Parking', 'parking', 'parking', 'Number of parking spaces'),
		bodyNumberField(
			'Parking Covered',
			'parkingCovered',
			'parking_covered',
			'Number of covered parking spaces',
		),
		bodyNumberField('Private Area', 'privateArea', 'private_area', 'Private area in square meters'),
		bodyStringField(
			'Project Code',
			'project',
			'project',
			'Project unique_code when the property belongs to a project',
		),
		bodyStringField(
			'Promoter Broker',
			'promoterBroker',
			'promoter_broker',
			'Promoter advisor. Defaults to Broker when omitted.',
		),
		bodyStringField(
			'Publication Date',
			'publicationDate',
			'publication_date',
			'Publication date in Domus format YYYY-MM-DD HH:mm:ss',
			'e.g. 2020-03-30 11:10:00',
		),
		bodyStringField('Reference', 'reference', 'reference', 'Internal property reference'),
		bodyStringField(
			'Registration',
			'registration',
			'registration',
			'Property registration / folio number',
		),
		bodyNumberField(
			'Remodeling Year',
			'remodelingYear',
			'remodeling_year',
			'Year the property was remodeled',
		),
		bodyStringField(
			'Stratum',
			'stratum',
			'stratum',
			'Colombian socioeconomic stratum',
			'e.g. 4',
		),
		bodyStringField('Tour 3D', 'tour3d', 'tour3d', '3D or 360 tour URL'),
		bodyStringField(
			'Update Date',
			'updateDate',
			'update_date',
			'Update date in Domus format YYYY-MM-DD HH:mm:ss',
			'e.g. 2020-03-30 11:10:00',
		),
		bodyStringField('Video', 'video', 'video', 'Property video URL'),
		bodyBooleanField(
			'Window Sign',
			'windowSign',
			'window_sign',
			'Whether the property has a window sign',
		),
		createDomusLocator({
			displayName: 'Zone',
			name: 'zone',
			searchListMethod: 'searchCatalogZones',
			sendType: 'body',
			sendProperty: 'zone',
			placeholder: 'e.g. 3',
			description:
				'Cardinal zone from the full catalog (norte, sur, …). Required by Domus if City Zone is not sent.',
		}),
	];

	if (options.includeAddress) {
		fields.push(
			bodyStringField(
				'Address',
				'address',
				'address',
				'Property street address',
				'e.g. Calle 123 #45-67',
			),
		);
	}

	if (options.includeBusinessType) {
		fields.push(
			createDomusLocator({
				displayName: 'Business Type',
				name: 'businessType',
				searchListMethod: 'searchCatalogBusinessTypes',
				sendType: 'body',
				sendProperty: 'biz',
				placeholder: 'e.g. 2',
				description:
					'Business type from the full catalog. Rent is required when biz is 1 or 3; sale price is required when biz is 2 or 3.',
			}),
		);
	}

	if (options.includeCity) {
		fields.push(
			createDomusLocator({
				displayName: 'City',
				name: 'city',
				searchListMethod: 'searchCatalogCities',
				sendType: 'body',
				sendProperty: 'city',
				placeholder: 'e.g. 11001',
				description: 'City from the full Domus catalog',
			}),
		);
	}

	if (options.includeDeletePictures) {
		fields.push(
			bodyBooleanField(
				'Delete Pictures',
				'deletePictures',
				'delete_pictures',
				'Whether to remove every picture currently attached to the property',
			),
		);
	}

	if (options.includeNeighborhoodCode) {
		fields.push(
			createDomusLocator({
				displayName: 'Neighborhood',
				name: 'neighborhoodCode',
				searchListMethod: 'searchCatalogNeighborhoods',
				sendType: 'body',
				sendProperty: 'neighborhood_code',
				placeholder: 'e.g. 4751',
				description:
					'Catalog neighborhood. Required by Domus if Neighborhood Name is not sent. Scoped to the selected city.',
				loadOptionsDependsOn: cityDependsOn,
			}),
		);
	}

	if (options.includePrices) {
		fields.push(
			{
				displayName: 'Rent',
				name: 'rent',
				type: 'number',
				default: 0,
				description: 'Rental price. Required by Domus when Business Type is 1 or 3.',
				routing: {
					send: {
						type: 'body',
						property: 'rent',
					},
				},
			},
			{
				displayName: 'Sale Price',
				name: 'salePrice',
				type: 'number',
				default: 0,
				description: 'Sale price. Required by Domus when Business Type is 2 or 3.',
				routing: {
					send: {
						type: 'body',
						property: 'saleprice',
					},
				},
			},
		);
	}

	if (options.includePropertyCode) {
		fields.push(
			bodyStringField(
				'Property Code',
				'propertyCode',
				'codpro',
				'Optional listing code when the agency does not generate codes automatically',
				'e.g. 262',
			),
		);
	}

	if (options.includePropertyType) {
		fields.push(
			createDomusLocator({
				displayName: 'Property Type',
				name: 'propertyType',
				searchListMethod: 'searchCatalogPropertyTypes',
				sendType: 'body',
				sendProperty: 'type',
				placeholder: 'e.g. 5',
				description: 'Property type from the full catalog',
			}),
		);
	}

	if (options.includeStatus) {
		fields.push(
			createDomusLocator({
				displayName: 'Status',
				name: 'status',
				searchListMethod: 'searchStatuses',
				sendType: 'body',
				sendProperty: 'status',
				placeholder: 'e.g. 3',
				description:
					'Initial status. When omitted, Domus applies the agency default. Do not use Update to change status later.',
			}),
		);
	}

	return fields.sort((left, right) =>
		left.displayName.localeCompare(right.displayName, 'en', { sensitivity: 'base' }),
	);
};

export const omitEmptyNumberExpression = omitEmptyNumber;

import type { INodeProperties } from 'n8n-workflow';
import { createDomusLocator } from '../locators';
import { serializeOwnerPhones } from './phones.helpers';

interface OwnerWriteFieldOptions {
	includeIdentity?: boolean;
	includePhonesRecursive?: boolean;
}

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

export const ownerPhonesField: INodeProperties = {
	displayName: 'Phones',
	name: 'phones',
	type: 'fixedCollection',
	typeOptions: {
		multipleValues: true,
	},
	placeholder: 'Add Phone',
	default: {},
	description: 'Owner phone numbers, sent to Domus as the documented phones JSON array',
	options: [
		{
			displayName: 'Phone',
			name: 'phone',
			values: [
				{
					displayName: 'Type Name or ID',
					name: 'type',
					type: 'options',
					typeOptions: {
						loadOptionsMethod: 'getPhoneTypes',
					},
					default: '',
					description:
						'Phone type. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				},
				{
					displayName: 'Number',
					name: 'number',
					type: 'string',
					default: '',
					placeholder: 'e.g. 3001234567',
					description: 'Phone number',
				},
			],
		},
	],
	routing: {
		send: {
			type: 'body',
			property: 'phones',
			preSend: [serializeOwnerPhones],
		},
	},
};

export const ownerWriteFields = (options: OwnerWriteFieldOptions = {}): INodeProperties[] => {
	const fields: INodeProperties[] = [
		bodyStringField(
			'Birthday',
			'birthday',
			'birthday',
			'Date of birth in YYYY-MM-DD',
			'e.g. 2020-03-13',
		),
		createDomusLocator({
			displayName: 'Branch',
			name: 'branch',
			searchListMethod: 'searchBranches',
			sendType: 'body',
			sendProperty: 'branch',
			placeholder: 'e.g. 10',
			description: 'Branch the owner belongs to. Defaults to the branch of the token session.',
		}),
		createDomusLocator({
			displayName: 'City',
			name: 'city',
			searchListMethod: 'searchCatalogCities',
			sendType: 'body',
			sendProperty: 'city',
			placeholder: 'e.g. 11001',
			description: 'City the owner belongs to. Defaults to the city of the branch in session.',
		}),
		bodyStringField(
			'Description',
			'description',
			'description',
			'Free comment stored on the owner record',
		),
		createDomusLocator({
			displayName: 'Document Type',
			name: 'documentType',
			searchListMethod: 'searchDocumentTypes',
			sendType: 'body',
			sendProperty: 'document_type',
			placeholder: 'e.g. 1',
			description: 'Identification document type',
		}),
		bodyStringField('Email', 'email', 'email', 'Owner email address', 'e.g. owner@example.com'),
		bodyStringField(
			'Neighborhood',
			'neighborhood',
			'neighborhood',
			'Residence neighborhood. Defaults to the neighborhood of the branch in session.',
		),
		ownerPhonesField,
		bodyStringField(
			'Property Code',
			'property',
			'property',
			'Property the owner has a share in. Domus associates the owner with it.',
			'e.g. 262',
		),
		{
			displayName: 'Share Percentage',
			name: 'sharePercentage',
			type: 'number',
			default: 0,
			typeOptions: {
				maxValue: 100,
				minValue: 0,
			},
			description: 'Ownership share for the associated property, up to 100 per property',
			routing: {
				send: {
					type: 'body',
					property: 'share_percentage',
				},
			},
		},
		bodyStringField(
			'Verification Digit',
			'verificationDigit',
			'verification_digit',
			'Verification digit, when the document type requires one',
			'e.g. 2',
		),
	];

	if (options.includeIdentity) {
		fields.push(
			bodyStringField('Document', 'document', 'document', 'Identification document number'),
			bodyStringField('First Name', 'name', 'name', 'Owner given names'),
			bodyStringField('Last Name', 'lastName', 'last_name', 'Owner family names'),
		);
	}

	if (options.includePhonesRecursive) {
		fields.push({
			displayName: 'Replace Phone List',
			name: 'phonesRecursive',
			type: 'boolean',
			default: true,
			description:
				'Whether the phones above replace the stored list. Domus requires this when phones are sent in the same shape as owner creation.',
			routing: {
				send: {
					type: 'body',
					property: 'phones_recursive',
					value: '={{ $value ? 1 : undefined }}',
				},
			},
		});
	}

	return fields.sort((left, right) =>
		left.displayName.localeCompare(right.displayName, 'en', { sensitivity: 'base' }),
	);
};

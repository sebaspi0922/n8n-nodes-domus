import {
	NodeOperationError,
	type IExecuteSingleFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

const showOnlyForContactCreate = {
	operation: ['create'],
	resource: ['contact'],
};

const omitEmptyValue = '={{ $value ? $value : undefined }}';

const isRecord = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value);

const readSentText = (value: unknown): string => {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number' && Number.isFinite(value)) return String(value);
	return '';
};

export const CONTACT_EMAIL_OR_PHONE_MESSAGE =
	'Email is required when Phone is empty, and Phone is required when Email is empty';

/**
 * Domus requires email when phone is absent, and phone when email is absent.
 * Both may be sent together. Neither field is unconditionally required.
 */
export const hasContactEmailOrPhone = (email: unknown, phone: unknown): boolean =>
	readSentText(email).length > 0 || readSentText(phone).length > 0;

export async function requireContactEmailOrPhone(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = isRecord(requestOptions.body) ? requestOptions.body : {};
	if (!hasContactEmailOrPhone(body.email, body.phone)) {
		throw new NodeOperationError(this.getNode(), CONTACT_EMAIL_OR_PHONE_MESSAGE);
	}

	return requestOptions;
}

export const contactCreateDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. Ada Lovelace',
		description: 'Contact name',
		displayOptions: {
			show: showOnlyForContactCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'name',
			},
		},
	},
	{
		displayName: 'Source',
		name: 'source',
		type: 'number',
		required: true,
		default: 0,
		description: 'Numeric source ID from this API. There is no source list for this field.',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: showOnlyForContactCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'source',
			},
		},
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		placeholder: 'e.g. name@email.com',
		description: 'Contact email. Required when Phone is empty.',
		displayOptions: {
			show: showOnlyForContactCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'email',
			},
		},
	},
	{
		displayName: 'Phone',
		name: 'phone',
		type: 'string',
		default: '',
		placeholder: 'e.g. 123456789,91828247',
		description: 'Comma-separated phone numbers. Required when Email is empty.',
		displayOptions: {
			show: showOnlyForContactCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'phone',
			},
		},
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		default: '',
		description: 'Last name. The full name can be sent in Name. Omitted when empty.',
		displayOptions: {
			show: showOnlyForContactCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'last_name',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Birth Date',
		name: 'birthDate',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		description: 'Birth date in YYYY-MM-DD format. Omitted when empty.',
		displayOptions: {
			show: showOnlyForContactCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'birthdate',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'number',
		default: 0,
		description: 'Numeric city ID from this API. There is no city list for this field. Omitted when left at 0.',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: showOnlyForContactCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'city',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Neighborhood',
		name: 'neighborhood',
		type: 'string',
		default: '',
		description: 'Neighborhood. Omitted when empty.',
		displayOptions: {
			show: showOnlyForContactCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'neighborhood',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		description: 'Comment about the contact. Omitted when empty.',
		displayOptions: {
			show: showOnlyForContactCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'description',
				value: omitEmptyValue,
			},
		},
	},
	{
		displayName: 'Broker',
		name: 'broker',
		type: 'number',
		default: 0,
		description:
			'Numeric broker ID from this API, when it differs from the token owner. Omitted when left at 0.',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: showOnlyForContactCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'broker',
				value: omitEmptyValue,
			},
		},
	},
];

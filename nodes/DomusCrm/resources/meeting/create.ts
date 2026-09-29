import {
	NodeOperationError,
	type IExecuteSingleFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';
import { createCrmLocator } from '../locators';

const showOnlyForMeetingCreate = {
	operation: ['create'],
	resource: ['meeting'],
};

const omitEmptyValue = '={{ $value ? $value : undefined }}';

const isRecord = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value);

const readSentText = (value: unknown): string => {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number' && Number.isFinite(value)) return String(value);
	return '';
};

export const MEETING_PLACE_OR_PROPERTY_CODE_MESSAGE =
	'Place is required when Property Code is empty, and Property Code is required when Place is empty';

/**
 * Domus requires place when codpro is absent, and codpro when place is absent.
 * Both may be sent together. Neither field is unconditionally required.
 */
export const hasMeetingPlaceOrPropertyCode = (place: unknown, propertyCode: unknown): boolean =>
	readSentText(place).length > 0 || readSentText(propertyCode).length > 0;

export async function requireMeetingPlaceOrPropertyCode(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = isRecord(requestOptions.body) ? requestOptions.body : {};
	if (!hasMeetingPlaceOrPropertyCode(body.place, body.codpro)) {
		throw new NodeOperationError(this.getNode(), MEETING_PLACE_OR_PROPERTY_CODE_MESSAGE);
	}

	return requestOptions;
}

export const meetingCreateDescription: INodeProperties[] = [
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'yyyy-mm-dd hh:mm:ss',
		description: 'Meeting start in yyyy-mm-dd hh:mm:ss. Search uses a different YYYY-MM-DD date.',
		displayOptions: {
			show: showOnlyForMeetingCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'start_date',
			},
		},
	},
	{
		displayName: 'Finish Date',
		name: 'finishDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'yyyy-mm-dd hh:mm:ss',
		description: 'Meeting finish in yyyy-mm-dd hh:mm:ss',
		displayOptions: {
			show: showOnlyForMeetingCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'finish_date',
			},
		},
	},
	{
		displayName: 'Notes',
		name: 'notes',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. Visit with the owner',
		description: 'Description of the meeting',
		displayOptions: {
			show: showOnlyForMeetingCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'notes',
			},
		},
	},
	createCrmLocator({
		displayName: 'Meeting Type',
		name: 'dateType',
		placeholder: 'e.g. 2299',
		description: 'Meeting type ID from this CRM API, sent as date_type',
		required: true,
		displayOptions: {
			show: showOnlyForMeetingCreate,
		},
		searchListMethod: 'searchMeetingTypes',
		sendProperty: 'date_type',
		sendType: 'body',
	}),
	{
		displayName: 'Place',
		name: 'place',
		type: 'string',
		default: '',
		placeholder: 'e.g. Domus',
		description: 'Meeting place. Required when Property Code is empty.',
		displayOptions: {
			show: showOnlyForMeetingCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'place',
			},
		},
	},
	{
		displayName: 'Property Code',
		name: 'propertyCode',
		type: 'string',
		default: '',
		placeholder: 'e.g. 123',
		description: 'Property code sent as codpro. Required when Place is empty.',
		displayOptions: {
			show: showOnlyForMeetingCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'codpro',
			},
		},
	},
	{
		displayName: 'Contact',
		name: 'contact',
		type: 'number',
		default: 0,
		description: 'Numeric contact ID from this CRM API. Omitted when left at 0.',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: showOnlyForMeetingCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'contact',
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
			'Numeric broker ID from this CRM API, when it differs from the token owner. Omitted when left at 0.',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: showOnlyForMeetingCreate,
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

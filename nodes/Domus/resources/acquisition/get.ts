import type { INodeProperties } from 'n8n-workflow';

const showOnlyForAcquisitionGet = {
	operation: ['get'],
	resource: ['acquisition'],
};

export const acquisitionGetDescription: INodeProperties[] = [
	{
		displayName: 'Acquisition Code',
		name: 'acquisitionCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 1',
		description:
			'Code the agency assigned to the acquisition. Send 0 when the acquisition has no assigned code and identify it with Unique Code instead.',
		displayOptions: {
			show: showOnlyForAcquisitionGet,
		},
	},
	{
		displayName: 'Unique Code',
		name: 'acquisitionUniqueCode',
		type: 'string',
		default: '',
		placeholder: 'e.g. 3',
		description: 'Automatic Domus code, required when the acquisition code is 0',
		displayOptions: {
			show: showOnlyForAcquisitionGet,
		},
		routing: {
			send: {
				type: 'query',
				property: 'unique_code',
			},
		},
	},
];

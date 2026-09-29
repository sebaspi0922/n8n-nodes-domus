import type { INodeProperties } from 'n8n-workflow';
import { createDomusLocator } from '../locators';

const showOnlyForPropertySeparate = {
	operation: ['separate'],
	resource: ['property'],
};

export const propertySeparateDescription: INodeProperties[] = [
	{
		displayName:
			'This reserves the property. It does not delete it, and it is not Change Status. Domus documents the path as /properties/detach/{codpro}.',
		name: 'separateNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: showOnlyForPropertySeparate,
		},
	},
	createDomusLocator({
		displayName: 'Status',
		name: 'separationStatus',
		searchListMethod: 'searchDetachStatuses',
		sendType: 'body',
		sendProperty: 'status',
		placeholder: 'e.g. 1',
		required: true,
		description: 'Separation status from the detach-status catalog',
		displayOptions: {
			show: showOnlyForPropertySeparate,
		},
	}),
	{
		displayName: 'Additional Fields',
		name: 'separateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForPropertySeparate,
		},
		options: [
			{
				displayName: 'Comment',
				name: 'comment',
				type: 'string',
				default: '',
				description: 'Comment stored with the separation',
				routing: {
					send: {
						type: 'body',
						property: 'comment',
					},
				},
			},
			{
				displayName: 'Days',
				name: 'days',
				type: 'number',
				default: 0,
				description: 'Number of days the property stays separated',
				typeOptions: {
					minValue: 0,
				},
				routing: {
					send: {
						type: 'body',
						property: 'days',
					},
				},
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'number',
				default: 0,
				description: 'Value recorded for the separation',
				routing: {
					send: {
						type: 'body',
						property: 'value',
					},
				},
			},
		],
	},
];

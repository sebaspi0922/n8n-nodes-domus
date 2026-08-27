import type { INodeProperties } from 'n8n-workflow';
import { createDomusLocator } from '../locators';

const showOnlyForPropertyChangeStatus = {
	operation: ['changeStatus'],
	resource: ['property'],
};

export const propertyChangeStatusDescription: INodeProperties[] = [
	createDomusLocator({
		displayName: 'Status',
		name: 'status',
		searchListMethod: 'searchStatuses',
		sendType: 'body',
		sendProperty: 'status',
		placeholder: 'e.g. 1',
		required: true,
		description: 'New property status. Do not use this operation to reserve or separate a property.',
		displayOptions: {
			show: showOnlyForPropertyChangeStatus,
		},
	}),
	{
		displayName: 'Additional Fields',
		name: 'changeStatusFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForPropertyChangeStatus,
		},
		options: [
			createDomusLocator({
				displayName: 'Broker',
				name: 'broker',
				searchListMethod: 'searchBrokers',
				sendType: 'body',
				sendProperty: 'broker',
				placeholder: 'e.g. 1256',
				description: 'Advisor who closed or is responsible for the deal',
			}),
			{
				displayName: 'Change Date',
				name: 'changeDate',
				type: 'string',
				default: '',
				placeholder: 'e.g. 2020-03-30 11:00:00',
				description: 'Status change date in Domus format YYYY-MM-DD HH:mm:ss. Defaults to now.',
				routing: {
					send: {
						type: 'body',
						property: 'change_date',
					},
				},
			},
			{
				displayName: 'Comment',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Comment stored with the status change',
				routing: {
					send: {
						type: 'body',
						property: 'description',
					},
				},
			},
			{
				displayName: 'Deal Value',
				name: 'value',
				type: 'number',
				default: 0,
				description: 'Final deal value. Domus defaults to the property price when omitted.',
				routing: {
					send: {
						type: 'body',
						property: 'value',
					},
				},
			},
			{
				displayName: 'Partner Agency Code',
				name: 'realState',
				type: 'string',
				default: '',
				description: 'Agency that closed the deal (real_state)',
				routing: {
					send: {
						type: 'body',
						property: 'real_state',
					},
				},
			},
			createDomusLocator({
				displayName: 'Source',
				name: 'source',
				searchListMethod: 'searchSources',
				sendType: 'body',
				sendProperty: 'source',
				placeholder: 'e.g. 57',
				description: 'Provenance of the deal, used by Domus for statistics',
			}),
		],
	},
];

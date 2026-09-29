import type { INodeProperties } from 'n8n-workflow';

type DomusLocatorConfig = {
	description: string;
	displayName: string;
	displayOptions?: INodeProperties['displayOptions'];
	loadOptionsDependsOn?: string[];
	name: string;
	placeholder: string;
	required?: boolean;
	searchListMethod: string;
} & (
	| {
			send?: true;
			sendProperty: string;
			sendType: 'body' | 'query';
	  }
	| {
			send: false;
	  }
);

export const createDomusLocator = (config: DomusLocatorConfig): INodeProperties => ({
	displayName: config.displayName,
	name: config.name,
	type: 'resourceLocator',
	required: config.required,
	default: { mode: 'list', value: '' },
	description: config.description,
	displayOptions: config.displayOptions,
	typeOptions: config.loadOptionsDependsOn
		? { loadOptionsDependsOn: config.loadOptionsDependsOn }
		: undefined,
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: `Select ${config.displayName.toLocaleLowerCase()}...`,
			typeOptions: {
				searchListMethod: config.searchListMethod,
				searchable: true,
			},
		},
		{
			displayName: 'By Code',
			name: 'id',
			type: 'string',
			placeholder: config.placeholder,
		},
	],
	...(config.send === false
		? {}
		: {
				routing: {
					send: {
						type: config.sendType,
						property: config.sendProperty,
					},
				},
			}),
});

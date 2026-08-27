import type { INodeProperties } from 'n8n-workflow';
import { projectGetDescription } from './get';
import { projectSearchDescription } from './search';

const showOnlyForProjects = {
	resource: ['project'],
};

export const projectDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForProjects,
		},
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search projects',
				description: 'Search for Domus V2 projects and return each result as an n8n item',
				routing: {
					request: {
						method: 'GET',
						url: '/projects-v2',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'data',
								},
							},
						],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a project',
				description: 'Get a Domus V2 project with its unit types, prices, and pictures',
				routing: {
					request: {
						method: 'GET',
						url: '=/projects-v2/{{$parameter.projectCode}}',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'data',
								},
							},
						],
					},
				},
			},
		],
		default: 'search',
	},
	...projectGetDescription,
	...projectSearchDescription,
];

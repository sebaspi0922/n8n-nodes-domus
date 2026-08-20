import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { DOMUS_BASE_URL_EXPRESSION, DOMUS_CREDENTIAL_NAME } from './constants';
import { propertyDescription } from './resources/property';

export class Domus implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Domus',
		name: 'domus',
		icon: 'file:domus.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Consulta Domus CRM mediante Domus API 3.0',
		defaults: {
			name: 'Domus',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: DOMUS_CREDENTIAL_NAME, required: true }],
		requestDefaults: {
			baseURL: DOMUS_BASE_URL_EXPRESSION,
			headers: {
				Accept: 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Inmueble',
						value: 'property',
					},
				],
				default: 'property',
			},
			...propertyDescription,
		],
	};
}

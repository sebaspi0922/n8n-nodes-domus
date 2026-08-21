import type { INodeProperties } from 'n8n-workflow';
import { propertyGetDescription } from './get';
import { propertySearchDescription } from './search';

const showOnlyForProperties = {
	resource: ['property'],
};

export const propertyDescription: INodeProperties[] = [
	{
		displayName: 'Operación',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForProperties,
		},
		options: [
			{
				name: 'Buscar',
				value: 'search',
				action: 'Buscar inmuebles',
				description: 'Busca inmuebles y devuelve cada resultado como un item de n8n',
				routing: {
					request: {
						method: 'GET',
						url: '/properties',
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
				name: 'Obtener',
				value: 'get',
				action: 'Obtener un inmueble',
				description: 'Obtiene el detalle completo de un inmueble por su código',
				routing: {
					request: {
						method: 'GET',
						url: '=/properties/{{$parameter.propertyCode}}{{$parameter.propertyId ? "/" + $parameter.propertyId : ""}}',
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
	...propertyGetDescription,
	...propertySearchDescription,
];

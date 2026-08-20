import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';
import {
	DOMUS_BASE_URL_EXPRESSION,
	DOMUS_PRODUCTION_BASE_URL,
	DOMUS_TEST_BASE_URL,
} from '../nodes/Domus/constants';

export class DomusApi implements ICredentialType {
	name = 'domusApi';

	displayName = 'Domus API';

	icon = 'file:../nodes/Domus/domus.png' as const;

	documentationUrl = 'https://apiv3get.domus.la/docs/3.0/comenzar';

	properties: INodeProperties[] = [
		{
			displayName: 'Token',
			name: 'token',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Token de acceso proporcionado por Domus',
		},
		{
			displayName: 'Entorno',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Pruebas',
					value: DOMUS_TEST_BASE_URL,
				},
				{
					name: 'Producción',
					value: DOMUS_PRODUCTION_BASE_URL,
				},
			],
			default: DOMUS_TEST_BASE_URL,
			description: 'Entorno de Domus API al que se enviarán las peticiones',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{$credentials.token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: DOMUS_BASE_URL_EXPRESSION,
			url: '/general/countries',
			method: 'GET',
		},
	};
}

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

	icon = 'file:../nodes/Domus/domus.svg' as const;

	documentationUrl = 'https://apiv3get.domus.la/docs/3.0/comenzar';

	properties: INodeProperties[] = [
		{
			displayName: 'Token',
			name: 'token',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Access token provided by Domus',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Testing',
					value: DOMUS_TEST_BASE_URL,
				},
				{
					name: 'Production',
					value: DOMUS_PRODUCTION_BASE_URL,
				},
			],
			default: DOMUS_TEST_BASE_URL,
			description: 'Domus API environment to send requests to',
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

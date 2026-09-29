import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';
import { DOMUS_CRM_BASE_URL } from '../nodes/DomusCrm/constants';

export class DomusCrmApi implements ICredentialType {
	name = 'domusCrmApi';

	displayName = 'Domus CRM API';

	icon = 'file:../nodes/Domus/domus.svg' as const;

	documentationUrl = 'https://apind.domus.la/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'Token',
			name: 'token',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Access token for the Domus CRM API at apind.domus.la',
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
			baseURL: DOMUS_CRM_BASE_URL,
			url: '/meetings/types',
			method: 'GET',
		},
	};
}

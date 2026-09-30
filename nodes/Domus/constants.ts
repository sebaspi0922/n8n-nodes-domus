export const DOMUS_CREDENTIAL_NAME = 'domusApi';
export const DOMUS_CRM_CREDENTIAL_NAME = 'domusCrmApi';

export const DOMUS_TEST_BASE_URL = 'https://newapi.domus.la';
export const DOMUS_PRODUCTION_BASE_URL = 'https://api.domus.la/3.0';
export const DOMUS_CRM_BASE_URL = 'https://apind.domus.la';

/** API 2.0 host for contacts. Meetings, opportunities, and profiles stay on DOMUS_CRM_BASE_URL. */
export const DOMUS_CONTACTS_BASE_URL = 'https://api.domus.la';

export const DOMUS_BASE_URL_EXPRESSION = '={{$credentials.environment}}';

export const DOMUS_API_RESOURCES = [
	'acquisition',
	'advisor',
	'branch',
	'owner',
	'project',
	'property',
];

export const DOMUS_CRM_RESOURCES = ['contact', 'meeting', 'opportunity', 'profile'];

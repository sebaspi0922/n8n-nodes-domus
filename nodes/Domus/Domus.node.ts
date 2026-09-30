import { VersionedNodeType, type INodeTypeBaseDescription } from 'n8n-workflow';
import { DomusV1 } from './DomusV1';
import { DomusV2 } from './DomusV2';

const baseDescription: INodeTypeBaseDescription = {
	displayName: 'Domus',
	name: 'domus',
	icon: {
		light: 'file:domus.svg',
		dark: 'file:domus.dark.svg',
	},
	group: ['transform'],
	description:
		'Interact with Domus properties, owners, meetings, opportunities, profiles, and contacts',
	defaultVersion: 2,
	usableAsTool: true,
};

export class Domus extends VersionedNodeType {
	constructor() {
		super(
			{
				1: new DomusV1(),
				2: new DomusV2(),
			},
			baseDescription,
		);
	}
}

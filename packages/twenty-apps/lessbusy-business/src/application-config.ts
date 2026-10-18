import { defineApplication } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineApplication({ universalIdentifier: BUSINESS_IDENTIFIERS.application, displayName: 'LessBusy Business', description: 'Products, inventory, customer sales and invoicing in your existing workspace.', defaultRoleUniversalIdentifier: BUSINESS_IDENTIFIERS.defaultRole });

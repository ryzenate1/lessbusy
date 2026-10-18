import { defineIndex } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineIndex({ universalIdentifier: '9a3c58a3-2421-4ecd-89fd-1f9fa73ae77b', objectUniversalIdentifier: BUSINESS_IDENTIFIERS.invoice.object, isUnique: false, fields: [{ universalIdentifier: '1caa3f6c-77ee-463b-be01-921afad8cc89', fieldUniversalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.status }, { universalIdentifier: '17858a56-588e-4dcb-bca3-faa93bafac5c', fieldUniversalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.dueAt }] });

import { defineIndex } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineIndex({ universalIdentifier: '1b36091f-2323-4e72-b104-8777086bc1b6', objectUniversalIdentifier: BUSINESS_IDENTIFIERS.integrationEvent.object, isUnique: true, fields: [{ universalIdentifier: '7333a4e6-2f9d-4678-b6a8-bcb6830ec359', fieldUniversalIdentifier: BUSINESS_IDENTIFIERS.integrationEvent.fields.externalKey }] });

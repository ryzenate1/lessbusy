import { defineIndex } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineIndex({ universalIdentifier: '0712f574-82de-4521-9ab9-aff87ad5573e', objectUniversalIdentifier: BUSINESS_IDENTIFIERS.reservation.object, isUnique: false, fields: [{ universalIdentifier: '932235a5-0c37-4c97-8648-622cf39d4e8a', fieldUniversalIdentifier: BUSINESS_IDENTIFIERS.reservation.fields.salesOrderId }, { universalIdentifier: '27138f5c-9eba-4931-828e-8b416841c348', fieldUniversalIdentifier: BUSINESS_IDENTIFIERS.reservation.fields.status }] });

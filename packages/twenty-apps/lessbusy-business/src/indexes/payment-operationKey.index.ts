import { defineIndex } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineIndex({ universalIdentifier: "17c1d737-199f-4fe6-ab4f-550c12948657", objectUniversalIdentifier: BUSINESS_IDENTIFIERS.payment.object, isUnique: true, fields: [{ universalIdentifier: "016b4545-ee03-438d-a625-d1a1b77b95cd", fieldUniversalIdentifier: BUSINESS_IDENTIFIERS.payment.fields.operationKey }] });

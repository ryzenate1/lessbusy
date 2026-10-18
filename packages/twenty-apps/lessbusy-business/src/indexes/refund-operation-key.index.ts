import { defineIndex } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineIndex({ universalIdentifier: 'ecff5e7b-ae43-419c-b717-8d6e1ec7a927', objectUniversalIdentifier: BUSINESS_IDENTIFIERS.refund.object, isUnique: true, fields: [{ universalIdentifier: '3abd2bb1-7958-4b90-9673-b198f83f011d', fieldUniversalIdentifier: BUSINESS_IDENTIFIERS.refund.fields.operationKey }] });

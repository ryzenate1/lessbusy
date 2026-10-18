import { defineIndex } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineIndex({ universalIdentifier: 'a1a5872a-cb42-49ca-b39c-245ccf25c9e4', objectUniversalIdentifier: BUSINESS_IDENTIFIERS.lead.object, isUnique: false, fields: [{ universalIdentifier: '20a05c32-1bfe-4ec7-88d8-cdf5b9bc82c8', fieldUniversalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.temperature }, { universalIdentifier: 'ae9cc61e-e832-4cd3-ab13-b07682863564', fieldUniversalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.nextFollowUpAt }] });

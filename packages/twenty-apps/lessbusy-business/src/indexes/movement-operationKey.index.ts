import { defineIndex } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineIndex({ universalIdentifier: "20b3d98b-48b0-4aa2-af2e-59308238ebfa", objectUniversalIdentifier: BUSINESS_IDENTIFIERS.movement.object, isUnique: true, fields: [{ universalIdentifier: "80df2ac4-5069-4930-93ae-823e4a73be5d", fieldUniversalIdentifier: BUSINESS_IDENTIFIERS.movement.fields.operationKey }] });

import { defineIndex } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineIndex({ universalIdentifier: 'b7b50573-fab9-4fbd-9c2e-506389bc4b66', objectUniversalIdentifier: BUSINESS_IDENTIFIERS.invoice.object, isUnique: false, fields: [{ universalIdentifier: 'fc24afda-0b38-4b18-8944-6dfb68383af9', fieldUniversalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.finalizedAt }] });

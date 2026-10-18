import { defineField, FieldType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineField({ universalIdentifier: BUSINESS_IDENTIFIERS.customerFields.lbBillingName, objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier, name: 'lbBillingName', label: 'Billing name', type: FieldType.TEXT, isNullable: true });

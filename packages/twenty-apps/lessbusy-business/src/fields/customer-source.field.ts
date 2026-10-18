import { defineField, FieldType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineField({ universalIdentifier: BUSINESS_IDENTIFIERS.customerFields.lbSource, objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier, name: 'lbSource', label: 'Customer source', type: FieldType.TEXT, isNullable: true });

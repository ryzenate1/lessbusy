import { defineField, FieldType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineField({ universalIdentifier: BUSINESS_IDENTIFIERS.customerFields.lbTags, objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier, name: 'lbTags', label: 'Customer tags', type: FieldType.RAW_JSON, isNullable: true });

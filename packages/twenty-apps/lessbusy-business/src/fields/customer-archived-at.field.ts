import { defineField, FieldType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineField({ universalIdentifier: BUSINESS_IDENTIFIERS.customerFields.lbArchivedAt, objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier, name: 'lbArchivedAt', label: 'Archived at', type: FieldType.DATE_TIME, isNullable: true });

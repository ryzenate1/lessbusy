import { defineField, FieldType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineField({ universalIdentifier: BUSINESS_IDENTIFIERS.taskFields.lbOperationHash, objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier, name: 'lbOperationHash', label: 'Operation hash', type: FieldType.TEXT, isNullable: true, isUIEditable: false, isAuditLogged: false });

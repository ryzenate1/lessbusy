import { defineField, FieldType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineField({ universalIdentifier: BUSINESS_IDENTIFIERS.taskFields.lbReminderAcknowledgedAt, objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier, name: 'lbReminderAcknowledgedAt', label: 'Reminder acknowledged at', type: FieldType.DATE_TIME, isNullable: true });

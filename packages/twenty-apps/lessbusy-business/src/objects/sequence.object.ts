import { defineObject, FieldType, ObjectSharingReach, RelationType, OnDeleteAction } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineObject({ universalIdentifier: BUSINESS_IDENTIFIERS.sequence.object, nameSingular: "lbNumberSequence", namePlural: "lbNumberSequences", labelSingular: "Number sequence", labelPlural: "Document numbers", icon: "IconHash", sharingReach: ObjectSharingReach.ROLE_ACCESS, isUICreatable: false, isUIEditable: false, labelIdentifierFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.sequence.name, fields: [
{ universalIdentifier: BUSINESS_IDENTIFIERS.sequence.name, type: FieldType.TEXT, name: 'name', label: "Number sequence name", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.sequence.fields.nextValue, type: FieldType.NUMBER, name: "nextValue", label: "Next value", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.sequence.fields.version, type: FieldType.NUMBER, name: "version", label: "Version", isNullable: true, defaultValue: 0 }
] });

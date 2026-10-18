import { defineObject, FieldType, ObjectSharingReach, RelationType, OnDeleteAction } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineObject({ universalIdentifier: BUSINESS_IDENTIFIERS.profile.object, nameSingular: "lbBusinessProfile", namePlural: "lbBusinessProfiles", labelSingular: "Business profile", labelPlural: "Business settings", icon: "IconSettings", sharingReach: ObjectSharingReach.ROLE_ACCESS, isUICreatable: true, isUIEditable: true, labelIdentifierFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.profile.name, fields: [
{ universalIdentifier: BUSINESS_IDENTIFIERS.profile.fields.documentTemplate, type: FieldType.TEXT, name: 'documentTemplate', label: 'documentTemplate', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.profile.fields.documentNotes, type: FieldType.TEXT, name: 'documentNotes', label: 'documentNotes', isNullable: true },

{ universalIdentifier: BUSINESS_IDENTIFIERS.profile.name, type: FieldType.TEXT, name: 'name', label: "Business profile name", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.profile.fields.profileKey, type: FieldType.TEXT, name: "profileKey", label: "Profile key", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.profile.fields.businessType, type: FieldType.SELECT, name: "businessType", label: "Business type", isNullable: true, options: [{"value": "RETAIL", "label": "Retail", "position": 0, "color": "blue"}, {"value": "WHOLESALE", "label": "Wholesale", "position": 1, "color": "blue"}, {"value": "SERVICES", "label": "Services", "position": 2, "color": "blue"}, {"value": "AGENCY", "label": "Agency", "position": 3, "color": "blue"}, {"value": "ECOMMERCE", "label": "Ecommerce", "position": 4, "color": "blue"}, {"value": "OTHER", "label": "Other", "position": 5, "color": "blue"}] },
{ universalIdentifier: BUSINESS_IDENTIFIERS.profile.fields.enabledModules, type: FieldType.RAW_JSON, name: "enabledModules", label: "Enabled modules", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.profile.fields.currency, type: FieldType.TEXT, name: "currency", label: "Currency", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.profile.fields.locale, type: FieldType.TEXT, name: "locale", label: "Locale", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.profile.fields.identity, type: FieldType.RAW_JSON, name: "identity", label: "Identity", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.profile.fields.invoicePrefix, type: FieldType.TEXT, name: "invoicePrefix", label: "Invoice prefix", isNullable: true }
] });

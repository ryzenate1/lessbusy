import { defineObject, FieldType, ObjectSharingReach, RelationType, OnDeleteAction } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineObject({ universalIdentifier: BUSINESS_IDENTIFIERS.product.object, nameSingular: "lbProduct", namePlural: "lbProducts", labelSingular: "Product", labelPlural: "Products", icon: "IconBox", sharingReach: ObjectSharingReach.ROLE_ACCESS, isUICreatable: false, isUIEditable: false, labelIdentifierFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.product.name, fields: [
{ universalIdentifier: BUSINESS_IDENTIFIERS.product.fields.status, type: FieldType.TEXT, name: 'status', label: 'status', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.product.fields.currency, type: FieldType.TEXT, name: 'currency', label: 'currency', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.product.fields.images, type: FieldType.RAW_JSON, name: 'images', label: 'images', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.product.fields.version, type: FieldType.NUMBER, name: 'version', label: 'version', isNullable: false, defaultValue: 0 },
{ universalIdentifier: BUSINESS_IDENTIFIERS.product.fields.auditEvents, type: FieldType.RAW_JSON, name: 'auditEvents', label: 'auditEvents', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.product.fields.requestHash, type: FieldType.TEXT, name: 'requestHash', label: 'requestHash', isNullable: true },

{ universalIdentifier: BUSINESS_IDENTIFIERS.product.name, type: FieldType.TEXT, name: 'name', label: "Product name", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.product.fields.description, type: FieldType.TEXT, name: "description", label: "Description", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.product.fields.category, type: FieldType.TEXT, name: "category", label: "Category", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.product.fields.attributes, type: FieldType.RAW_JSON, name: "attributes", label: "Attributes", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.product.fields.isService, type: FieldType.BOOLEAN, name: "isService", label: "Is service", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.product.fields.variants, type: FieldType.RELATION, name: "variants", label: "Variants", relationTargetObjectMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.variant.object, relationTargetFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.variant.fields.product, universalSettings: { relationType: RelationType.ONE_TO_MANY } }
] });

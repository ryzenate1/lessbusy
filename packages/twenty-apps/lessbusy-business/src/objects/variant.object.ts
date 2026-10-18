import { defineObject, FieldType, ObjectSharingReach, RelationType, OnDeleteAction } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineObject({ universalIdentifier: BUSINESS_IDENTIFIERS.variant.object, nameSingular: "lbProductVariant", namePlural: "lbProductVariants", labelSingular: "Product variant", labelPlural: "Product variants", icon: "IconBarcode", sharingReach: ObjectSharingReach.ROLE_ACCESS, isUICreatable: false, isUIEditable: false, labelIdentifierFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.variant.name, fields: [
{ universalIdentifier: BUSINESS_IDENTIFIERS.variant.fields.costAmountMinor, type: FieldType.TEXT, name: 'costAmountMinor', label: 'costAmountMinor', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.variant.fields.taxBasisPoints, type: FieldType.NUMBER, name: 'taxBasisPoints', label: 'taxBasisPoints', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.variant.fields.barcode, type: FieldType.TEXT, name: 'barcode', label: 'barcode', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.variant.fields.status, type: FieldType.TEXT, name: 'status', label: 'status', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.variant.fields.tracksInventory, type: FieldType.BOOLEAN, name: 'tracksInventory', label: 'tracksInventory', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.variant.fields.attributesKey, type: FieldType.TEXT, name: 'attributesKey', label: 'attributesKey', isNullable: true },

{ universalIdentifier: BUSINESS_IDENTIFIERS.variant.name, type: FieldType.TEXT, name: 'name', label: "Product variant name", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.variant.fields.sku, type: FieldType.TEXT, name: "sku", label: "Sku", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.variant.fields.attributes, type: FieldType.RAW_JSON, name: "attributes", label: "Attributes", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.variant.fields.currency, type: FieldType.TEXT, name: "currency", label: "Currency", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.variant.fields.unitAmountMinor, type: FieldType.TEXT, name: "unitAmountMinor", label: "Unit amount minor", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.variant.fields.lowStockThresholdUnits, type: FieldType.NUMBER, name: "lowStockThresholdUnits", label: "Low stock threshold units", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.variant.fields.product, type: FieldType.RELATION, name: "product", label: "Product", relationTargetObjectMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.product.object, relationTargetFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.product.fields.variants, universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.RESTRICT, joinColumnName: "productId" }, isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.variant.fields.balances, type: FieldType.RELATION, name: "balances", label: "Balances", relationTargetObjectMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.balance.object, relationTargetFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.balance.fields.variant, universalSettings: { relationType: RelationType.ONE_TO_MANY } }
] });

import { defineObject, FieldType, ObjectSharingReach, RelationType, OnDeleteAction } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineObject({ universalIdentifier: BUSINESS_IDENTIFIERS.warehouse.object, nameSingular: "lbWarehouse", namePlural: "lbWarehouses", labelSingular: "Location", labelPlural: "Locations", icon: "IconBuildingWarehouse", sharingReach: ObjectSharingReach.ROLE_ACCESS, isUICreatable: true, isUIEditable: true, labelIdentifierFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.warehouse.name, fields: [
{ universalIdentifier: BUSINESS_IDENTIFIERS.warehouse.name, type: FieldType.TEXT, name: 'name', label: "Location name", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.warehouse.fields.address, type: FieldType.TEXT, name: "address", label: "Address", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.warehouse.fields.isActive, type: FieldType.BOOLEAN, name: "isActive", label: "Is active", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.warehouse.fields.balances, type: FieldType.RELATION, name: "balances", label: "Balances", relationTargetObjectMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.balance.object, relationTargetFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.balance.fields.warehouse, universalSettings: { relationType: RelationType.ONE_TO_MANY } }
] });

import { defineObject, FieldType, ObjectSharingReach, RelationType, OnDeleteAction } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineObject({ universalIdentifier: BUSINESS_IDENTIFIERS.movement.object, nameSingular: "lbStockMovement", namePlural: "lbStockMovements", labelSingular: "Stock movement", labelPlural: "Stock history", icon: "IconArrowsExchange", sharingReach: ObjectSharingReach.ROLE_ACCESS, isUICreatable: false, isUIEditable: false, labelIdentifierFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.movement.name, fields: [
{ universalIdentifier: BUSINESS_IDENTIFIERS.movement.name, type: FieldType.TEXT, name: 'name', label: "Stock movement name", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.movement.fields.operationKey, type: FieldType.TEXT, name: "operationKey", label: "Operation key", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.movement.fields.requestHash, type: FieldType.TEXT, name: "requestHash", label: "Request hash", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.movement.fields.kind, type: FieldType.TEXT, name: "kind", label: "Kind", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.movement.fields.quantityUnits, type: FieldType.NUMBER, name: "quantityUnits", label: "Quantity units", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.movement.fields.reason, type: FieldType.TEXT, name: "reason", label: "Reason", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.movement.fields.actorId, type: FieldType.UUID, name: "actorId", label: "Actor id", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.movement.fields.result, type: FieldType.RAW_JSON, name: "result", label: "Result", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.movement.fields.balance, type: FieldType.RELATION, name: "balance", label: "Balance", relationTargetObjectMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.balance.object, relationTargetFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.balance.fields.movements, universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.RESTRICT, joinColumnName: "balanceId" }, isNullable: true }
] });

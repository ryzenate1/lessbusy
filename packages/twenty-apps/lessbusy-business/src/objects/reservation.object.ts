import { defineObject, FieldType, ObjectSharingReach, RelationType, OnDeleteAction } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineObject({ universalIdentifier: BUSINESS_IDENTIFIERS.reservation.object, nameSingular: "lbStockReservation", namePlural: "lbStockReservations", labelSingular: "Reservation", labelPlural: "Stock reservations", icon: "IconLock", sharingReach: ObjectSharingReach.ROLE_ACCESS, isUICreatable: false, isUIEditable: false, labelIdentifierFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.reservation.name, fields: [
{ universalIdentifier: BUSINESS_IDENTIFIERS.reservation.fields.salesOrderId, type: FieldType.UUID, name: 'salesOrderId', label: 'Sales order', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.reservation.name, type: FieldType.TEXT, name: 'name', label: "Reservation name", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.reservation.fields.operationKey, type: FieldType.TEXT, name: "operationKey", label: "Operation key", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.reservation.fields.quantityUnits, type: FieldType.NUMBER, name: "quantityUnits", label: "Quantity units", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.reservation.fields.status, type: FieldType.TEXT, name: "status", label: "Status", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.reservation.fields.expiresAt, type: FieldType.DATE_TIME, name: "expiresAt", label: "Expires at", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.reservation.fields.version, type: FieldType.NUMBER, name: "version", label: "Version", isNullable: true, defaultValue: 0 },
{ universalIdentifier: BUSINESS_IDENTIFIERS.reservation.fields.balance, type: FieldType.RELATION, name: "balance", label: "Balance", relationTargetObjectMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.balance.object, relationTargetFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.balance.fields.reservations, universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.RESTRICT, joinColumnName: "balanceId" }, isNullable: true }
] });

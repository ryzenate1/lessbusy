import { defineObject, FieldType, ObjectSharingReach, RelationType, OnDeleteAction } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineObject({ universalIdentifier: BUSINESS_IDENTIFIERS.payment.object, nameSingular: "lbPayment", namePlural: "lbPayments", labelSingular: "Payment", labelPlural: "Customer payments", icon: "IconCreditCard", sharingReach: ObjectSharingReach.ROLE_ACCESS, isUICreatable: false, isUIEditable: false, labelIdentifierFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.payment.name, fields: [
{ universalIdentifier: BUSINESS_IDENTIFIERS.payment.name, type: FieldType.TEXT, name: 'name', label: "Payment name", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.payment.fields.operationKey, type: FieldType.TEXT, name: "operationKey", label: "Operation key", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.payment.fields.requestHash, type: FieldType.TEXT, name: "requestHash", label: "Request hash", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.payment.fields.amountMinor, type: FieldType.TEXT, name: "amountMinor", label: "Amount minor", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.payment.fields.currency, type: FieldType.TEXT, name: "currency", label: "Currency", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.payment.fields.method, type: FieldType.TEXT, name: "method", label: "Method", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.payment.fields.reference, type: FieldType.TEXT, name: "reference", label: "Reference", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.payment.fields.receivedAt, type: FieldType.DATE_TIME, name: "receivedAt", label: "Received at", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.payment.fields.actorId, type: FieldType.UUID, name: "actorId", label: "Actor id", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.payment.fields.invoice, type: FieldType.RELATION, name: "invoice", label: "Invoice", relationTargetObjectMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.invoice.object, relationTargetFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.payments, universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.RESTRICT, joinColumnName: "invoiceId" }, isNullable: true }
] });

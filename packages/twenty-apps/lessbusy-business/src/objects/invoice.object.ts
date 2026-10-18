import { defineObject, FieldType, ObjectSharingReach, RelationType, OnDeleteAction } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineObject({ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.object, nameSingular: "lbInvoice", namePlural: "lbInvoices", labelSingular: "Invoice", labelPlural: "Invoices", icon: "IconReceipt", sharingReach: ObjectSharingReach.ROLE_ACCESS, isUICreatable: false, isUIEditable: false, labelIdentifierFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.invoice.name, fields: [
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.amountCreditedMinor, type: FieldType.TEXT, name: 'amountCreditedMinor', label: 'Amount credited minor', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.amountRefundedMinor, type: FieldType.TEXT, name: 'amountRefundedMinor', label: 'Amount refunded minor', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.sourceDocumentId, type: FieldType.UUID, name: 'sourceDocumentId', label: 'sourceDocumentId', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.sourceDocumentKind, type: FieldType.TEXT, name: 'sourceDocumentKind', label: 'sourceDocumentKind', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.sourceDocumentKey, type: FieldType.TEXT, name: 'sourceDocumentKey', label: 'sourceDocumentKey', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.opportunityId, type: FieldType.UUID, name: 'opportunityId', label: 'opportunityId', isNullable: true },

{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.discountBasisPoints, type: FieldType.NUMBER, name: 'discountBasisPoints', label: 'Document discount basis points', isNullable: true, defaultValue: 0 },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.auditEvents, type: FieldType.RAW_JSON, name: 'auditEvents', label: 'auditEvents', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.name, type: FieldType.TEXT, name: 'name', label: "Invoice name", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.operationKey, type: FieldType.TEXT, name: "operationKey", label: "Operation key", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.requestHash, type: FieldType.TEXT, name: "requestHash", label: "Request hash", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.customerId, type: FieldType.UUID, name: "customerId", label: "Customer id", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.currency, type: FieldType.TEXT, name: "currency", label: "Currency", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.lines, type: FieldType.RAW_JSON, name: "lines", label: "Lines", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.totals, type: FieldType.RAW_JSON, name: "totals", label: "Totals", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.businessIdentity, type: FieldType.RAW_JSON, name: "businessIdentity", label: "Business identity", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.customerSnapshot, type: FieldType.RAW_JSON, name: "customerSnapshot", label: "Customer snapshot", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.status, type: FieldType.TEXT, name: "status", label: "Status", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.amountPaidMinor, type: FieldType.TEXT, name: "amountPaidMinor", label: "Amount paid minor", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.dueAt, type: FieldType.DATE_TIME, name: "dueAt", label: "Due at", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.finalizedAt, type: FieldType.DATE_TIME, name: "finalizedAt", label: "Finalized at", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.cancellationReason, type: FieldType.TEXT, name: "cancellationReason", label: "Cancellation reason", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.version, type: FieldType.NUMBER, name: "version", label: "Version", isNullable: true, defaultValue: 0 },
{ universalIdentifier: BUSINESS_IDENTIFIERS.invoice.fields.payments, type: FieldType.RELATION, name: "payments", label: "Payments", relationTargetObjectMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.payment.object, relationTargetFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.payment.fields.invoice, universalSettings: { relationType: RelationType.ONE_TO_MANY } }
] });

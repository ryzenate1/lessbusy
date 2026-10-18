import { defineObject, FieldType, ObjectSharingReach, RelationType, OnDeleteAction } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineObject({ universalIdentifier: BUSINESS_IDENTIFIERS.order.object, nameSingular: "lbSalesOrder", namePlural: "lbSalesOrders", labelSingular: "Order", labelPlural: "Sales orders", icon: "IconShoppingCart", sharingReach: ObjectSharingReach.ROLE_ACCESS, isUICreatable: false, isUIEditable: false, labelIdentifierFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.order.name, fields: [
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.sourceDocumentId, type: FieldType.UUID, name: 'sourceDocumentId', label: 'sourceDocumentId', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.sourceDocumentKind, type: FieldType.TEXT, name: 'sourceDocumentKind', label: 'sourceDocumentKind', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.sourceDocumentKey, type: FieldType.TEXT, name: 'sourceDocumentKey', label: 'sourceDocumentKey', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.convertedInvoiceId, type: FieldType.UUID, name: 'convertedInvoiceId', label: 'convertedInvoiceId', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.opportunityId, type: FieldType.UUID, name: 'opportunityId', label: 'opportunityId', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.inventoryState, type: FieldType.TEXT, name: 'inventoryState', label: 'inventoryState', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.stockReservations, type: FieldType.RAW_JSON, name: 'stockReservations', label: 'stockReservations', isNullable: true },

{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.discountBasisPoints, type: FieldType.NUMBER, name: 'discountBasisPoints', label: 'Document discount basis points', isNullable: true, defaultValue: 0 },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.auditEvents, type: FieldType.RAW_JSON, name: 'auditEvents', label: 'auditEvents', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.operationKey, type: FieldType.TEXT, name: 'operationKey', label: 'operationKey', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.requestHash, type: FieldType.TEXT, name: 'requestHash', label: 'requestHash', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.name, type: FieldType.TEXT, name: 'name', label: "Order name", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.customerId, type: FieldType.UUID, name: "customerId", label: "Customer id", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.currency, type: FieldType.TEXT, name: "currency", label: "Currency", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.lines, type: FieldType.RAW_JSON, name: "lines", label: "Lines", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.totals, type: FieldType.RAW_JSON, name: "totals", label: "Totals", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.status, type: FieldType.TEXT, name: "status", label: "Status", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.order.fields.version, type: FieldType.NUMBER, name: "version", label: "Version", isNullable: true, defaultValue: 0 }
] });

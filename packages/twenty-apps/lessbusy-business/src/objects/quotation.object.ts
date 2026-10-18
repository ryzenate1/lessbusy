import { defineObject, FieldType, ObjectSharingReach, RelationType, OnDeleteAction } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineObject({ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.object, nameSingular: "lbQuotation", namePlural: "lbQuotations", labelSingular: "Quotation", labelPlural: "Quotations", icon: "IconFileText", sharingReach: ObjectSharingReach.ROLE_ACCESS, isUICreatable: false, isUIEditable: false, labelIdentifierFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.quotation.name, fields: [
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.businessIdentity, type: FieldType.RAW_JSON, name: 'businessIdentity', label: 'businessIdentity', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.customerSnapshot, type: FieldType.RAW_JSON, name: 'customerSnapshot', label: 'customerSnapshot', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.issuedAt, type: FieldType.DATE_TIME, name: 'issuedAt', label: 'issuedAt', isNullable: true },

{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.convertedOrderId, type: FieldType.UUID, name: 'convertedOrderId', label: 'convertedOrderId', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.opportunityId, type: FieldType.UUID, name: 'opportunityId', label: 'opportunityId', isNullable: true },

{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.discountBasisPoints, type: FieldType.NUMBER, name: 'discountBasisPoints', label: 'Document discount basis points', isNullable: true, defaultValue: 0 },
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.auditEvents, type: FieldType.RAW_JSON, name: 'auditEvents', label: 'auditEvents', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.operationKey, type: FieldType.TEXT, name: 'operationKey', label: 'operationKey', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.requestHash, type: FieldType.TEXT, name: 'requestHash', label: 'requestHash', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.name, type: FieldType.TEXT, name: 'name', label: "Quotation name", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.customerId, type: FieldType.UUID, name: "customerId", label: "Customer id", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.currency, type: FieldType.TEXT, name: "currency", label: "Currency", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.lines, type: FieldType.RAW_JSON, name: "lines", label: "Lines", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.totals, type: FieldType.RAW_JSON, name: "totals", label: "Totals", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.status, type: FieldType.TEXT, name: "status", label: "Status", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.validUntil, type: FieldType.DATE_TIME, name: "validUntil", label: "Valid until", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.fields.version, type: FieldType.NUMBER, name: "version", label: "Version", isNullable: true, defaultValue: 0 }
] });

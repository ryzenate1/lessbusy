import { defineObject, FieldType, ObjectSharingReach, RelationType, OnDeleteAction } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineObject({ universalIdentifier: BUSINESS_IDENTIFIERS.lead.object, nameSingular: "lbLead", namePlural: "lbLeads", labelSingular: "Lead", labelPlural: "Leads", icon: "IconFlame", sharingReach: ObjectSharingReach.ROLE_ACCESS, isUICreatable: false, isUIEditable: false, labelIdentifierFieldMetadataUniversalIdentifier: BUSINESS_IDENTIFIERS.lead.name, fields: [
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.source, type: FieldType.TEXT, name: 'source', label: 'Lead source', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.assignedEmployeeId, type: FieldType.UUID, name: 'assignedEmployeeId', label: 'Assigned employee', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.convertedOpportunityId, type: FieldType.UUID, name: 'convertedOpportunityId', label: 'convertedOpportunityId', isNullable: true },

{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.version, type: FieldType.NUMBER, name: 'version', label: 'Version', isNullable: false, defaultValue: 0 },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.requestHash, type: FieldType.TEXT, name: 'requestHash', label: 'Request hash', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.reviewHistory, type: FieldType.RAW_JSON, name: 'reviewHistory', label: 'Review history', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.lastFollowUpTaskId, type: FieldType.UUID, name: 'lastFollowUpTaskId', label: 'Last follow-up task', isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.name, type: FieldType.TEXT, name: 'name', label: "Lead name", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.customerId, type: FieldType.UUID, name: "customerId", label: "Customer id", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.temperature, type: FieldType.SELECT, name: "temperature", label: "Temperature", isNullable: true, options: [{"value": "COLD", "label": "Cold", "position": 0, "color": "blue"}, {"value": "WARM", "label": "Warm", "position": 1, "color": "blue"}, {"value": "HOT", "label": "Hot", "position": 2, "color": "red"}] },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.intent, type: FieldType.TEXT, name: "intent", label: "Intent", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.productInterest, type: FieldType.TEXT, name: "productInterest", label: "Product interest", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.requestedQuantity, type: FieldType.TEXT, name: "requestedQuantity", label: "Requested quantity", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.budget, type: FieldType.TEXT, name: "budget", label: "Budget", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.urgency, type: FieldType.TEXT, name: "urgency", label: "Urgency", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.followUpRequired, type: FieldType.BOOLEAN, name: "followUpRequired", label: "Follow up required", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.recommendedAction, type: FieldType.TEXT, name: "recommendedAction", label: "Recommended action", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.confidence, type: FieldType.NUMBER, name: "confidence", label: "Confidence", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.priority, type: FieldType.SELECT, name: "priority", label: "Priority", isNullable: true, options: [{"value": "LOW", "label": "Low", "position": 0, "color": "blue"}, {"value": "NORMAL", "label": "Normal", "position": 1, "color": "blue"}, {"value": "HIGH", "label": "High", "position": 2, "color": "blue"}, {"value": "CRITICAL", "label": "Critical", "position": 3, "color": "blue"}] },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.handlingStatus, type: FieldType.SELECT, name: "handlingStatus", label: "Handling status", isNullable: true, options: [{"value": "AWAITING_BUSINESS", "label": "Awaiting Business", "position": 0, "color": "blue"}, {"value": "AWAITING_CUSTOMER", "label": "Awaiting Customer", "position": 1, "color": "blue"}, {"value": "AI_HANDLING", "label": "Ai Handling", "position": 2, "color": "blue"}, {"value": "HUMAN_HANDLING", "label": "Human Handling", "position": 3, "color": "blue"}, {"value": "RESOLVED", "label": "Resolved", "position": 4, "color": "blue"}] },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.classificationSource, type: FieldType.TEXT, name: "classificationSource", label: "Classification source", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.classifiedAt, type: FieldType.DATE_TIME, name: "classifiedAt", label: "Classified at", isNullable: true },
{ universalIdentifier: BUSINESS_IDENTIFIERS.lead.fields.nextFollowUpAt, type: FieldType.DATE_TIME, name: "nextFollowUpAt", label: "Next follow up at", isNullable: true }
] });

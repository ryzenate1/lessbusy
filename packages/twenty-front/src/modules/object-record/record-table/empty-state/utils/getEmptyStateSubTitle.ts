import { CoreObjectNameSingular } from 'twenty-shared/types';
import { t } from '@lingui/core/macro';

export const getEmptyStateSubTitle = (
  objectNameSingular: string,
  objectLabel: string,
) => {
  if (objectNameSingular === CoreObjectNameSingular.WorkflowVersion) {
    return t`Create a workflow and return here to view its versions`;
  }

  if (objectNameSingular === CoreObjectNameSingular.WorkflowRun) {
    return t`Run a workflow and return here to view its executions`;
  }

  if (objectNameSingular === 'person') {
    return t`Add your first customer to keep their details, notes and follow-ups in one place.`;
  }
  if (objectNameSingular === 'opportunity') {
    return t`Add a deal to track an interested buyer and plan the next step.`;
  }
  if (objectNameSingular === 'task') {
    return t`Add a task, choose who owns it and set a due date.`;
  }
  if (objectNameSingular === 'note') {
    return t`Save a note and connect it to the customer, company or deal it belongs to.`;
  }
  return t`Add your first ${objectLabel} to get started.`;
};

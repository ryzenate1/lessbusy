import { ForbiddenException, Injectable } from '@nestjs/common';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type ResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';

const protectedObjects = ['lbInventoryOperation', 'lbCreditAdjustment', 'lbRefund', 'lbContactIdentity', 'lbProduct', 'lbProductVariant', 'lbLead', 'lbConversationReference', 'lbIntegrationEvent', 'lbStockBalance', 'lbStockMovement', 'lbStockReservation', 'lbQuotation', 'lbSalesOrder', 'lbInvoice', 'lbPayment', 'lbNumberSequence'];
const protectedOperations = ['createOne', 'createMany', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'destroyOne', 'destroyMany', 'restoreOne', 'restoreMany', 'mergeMany'] as const;

export const PROTECTED_BUSINESS_MUTATION_HOOKS = protectedObjects.flatMap((objectName) => protectedOperations.map((operation) => {
  @Injectable()
  @WorkspaceQueryHook(`${objectName}.${operation}`)
  class ProtectedBusinessMutation implements WorkspacePreQueryHookInstance {
    async execute(_auth: WorkspaceAuthContext, _objectName: string, _payload: ResolverArgs): Promise<ResolverArgs> {
      throw new ForbiddenException('Use a LessBusy business action so amounts, stock, permissions and audit history are validated');
    }
  }
  return ProtectedBusinessMutation;
}));

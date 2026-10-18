import { LessBusyStockExpiryCronCommand } from 'src/modules/lessbusy/commands/lessbusy-stock-expiry.cron.command';
import { LessBusyStockExpiryDispatchJob } from 'src/modules/lessbusy/jobs/lessbusy-stock-expiry-dispatch.job';
import { LessBusyDealsService } from 'src/modules/lessbusy/services/lessbusy-deals.service';
import { LessBusyStockTransferService } from 'src/modules/lessbusy/services/lessbusy-stock-transfer.service';
import { LessBusyCustomersService } from 'src/modules/lessbusy/services/lessbusy-customers.service';
import { LessBusyWorkspaceGuard } from 'src/modules/lessbusy/controllers/lessbusy-workspace.guard';
import { LessBusyTasksService } from 'src/modules/lessbusy/services/lessbusy-tasks.service';
import { LessBusyStockExpiryJob } from 'src/modules/lessbusy/jobs/lessbusy-stock-expiry.job';
import { LessBusyStockExpiryService } from 'src/modules/lessbusy/services/lessbusy-stock-expiry.service';
import { LessBusyChatwootConnectionStore } from 'src/modules/lessbusy/chatwoot/lessbusy-chatwoot-connection.store';
import { SecretEncryptionModule } from 'src/engine/core-modules/secret-encryption/secret-encryption.module';
import { SecureHttpClientModule } from 'src/engine/core-modules/secure-http-client/secure-http-client.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { KeyValuePairEntity } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { LessBusySalesReportService } from 'src/modules/lessbusy/services/lessbusy-sales-report.service';
import { LessBusyInvoiceAdjustmentsService } from 'src/modules/lessbusy/services/lessbusy-invoice-adjustments.service';
import { LessBusyOrderInventoryService } from 'src/modules/lessbusy/services/lessbusy-order-inventory.service';
import { LessBusySalesConversionService } from 'src/modules/lessbusy/services/lessbusy-sales-conversion.service';
import { LessBusyCatalogueService } from 'src/modules/lessbusy/services/lessbusy-catalogue.service';
import { LessBusyLeadsService } from 'src/modules/lessbusy/services/lessbusy-leads.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { LessBusyChatwootService } from 'src/modules/lessbusy/chatwoot/lessbusy-chatwoot.service';
import { LessBusyChatwootWebhookController } from 'src/modules/lessbusy/controllers/lessbusy-chatwoot-webhook.controller';
import { LessBusyChatwootReferenceJob } from 'src/modules/lessbusy/jobs/lessbusy-chatwoot-reference.job';
import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { LessBusyBusinessController } from 'src/modules/lessbusy/controllers/lessbusy-business.controller';
import { LessBusyInventoryService } from 'src/modules/lessbusy/services/lessbusy-inventory.service';
import { LessBusySalesService } from 'src/modules/lessbusy/services/lessbusy-sales.service';
import { PROTECTED_BUSINESS_MUTATION_HOOKS } from 'src/modules/lessbusy/query-hooks/protected-business-mutations';

@Module({ imports: [AuthModule, WorkspaceCacheStorageModule, SecretEncryptionModule, SecureHttpClientModule, PermissionsModule, TypeOrmModule.forFeature([KeyValuePairEntity, ApplicationEntity, WorkspaceEntity])], controllers: [LessBusyBusinessController, LessBusyChatwootWebhookController], providers: [LessBusyStockExpiryCronCommand, LessBusyStockExpiryDispatchJob, LessBusyDealsService, LessBusyStockTransferService, LessBusyCustomersService, LessBusyWorkspaceGuard, LessBusyTasksService, LessBusyStockExpiryJob, LessBusyStockExpiryService, LessBusyChatwootConnectionStore, LessBusySalesReportService, LessBusyInvoiceAdjustmentsService, LessBusyOrderInventoryService, LessBusySalesConversionService, LessBusyCatalogueService, LessBusyLeadsService, LessBusyChatwootService, LessBusyChatwootReferenceJob, LessBusyInventoryService, LessBusySalesService, ...PROTECTED_BUSINESS_MUTATION_HOOKS], exports: [LessBusyStockExpiryCronCommand] })
export class LessBusyModule {}

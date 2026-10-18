import { msg } from '@lingui/core/macro';
import { IconFileText, IconSparkles, IconSearch, IconCheckbox } from 'twenty-ui/icon';
import { type SuggestedPrompt } from '@/ai/types/SuggestedPrompt';

export const getLessBusySuggestedPrompts = (page: string): SuggestedPrompt[] => {
  if (page === 'invoice-create') return [{ id: 'invoice-guide', label: msg`Help prepare this invoice`, Icon: IconFileText, prompts: [msg`Help me prepare an invoice proposal. Ask for the customer, currency, items, quantities and prices you need, then let me review it before saving.`] }];
  if (page === 'products' || page === 'product-create') return [{ id: 'product-options', label: msg`Plan product options`, Icon: IconSparkles, prompts: [msg`Help me organize the product or service I want to add. Suggest suitable attributes without changing any records. Details: `] }];
  if (page === 'deals') return [{ id: 'deal-review', label: msg`Review a deal`, Icon: IconSearch, prompts: [msg`Help me review a deal in this workspace. Ask which deal, retrieve only authorized records, and suggest the next step without changing its stage.`] }];
  if (page === 'inventory' || page === 'locations') return [{ id: 'stock-help', label: msg`Check available stock`, Icon: IconSearch, prompts: [msg`Help me find a product option and check its actual available stock by location. Keep the result timestamped and do not reserve or change any quantities.`] }];
  if (page === 'tasks') return [{ id: 'task-priorities', label: msg`Help plan my day`, Icon: IconCheckbox, prompts: [msg`Review my authorized open tasks and suggest what to prioritize. Do not change any tasks until I confirm.`] }];
  if (page === 'messages') return [{ id: 'message-help', label: msg`Explain inbox handoff`, Icon: IconSparkles, mode: 'SEND', prompts: [msg`Explain how customer conversations, lead qualification and human handoff work in LessBusy. Do not send any messages.`] }];
  return [
    { id: 'lessbusy-hot-leads', label: msg`Who is ready to buy?`, Icon: IconSearch, mode: 'SEND', prompts: [msg`Find authorized leads explicitly classified hot and suggest useful follow-ups. Keep readiness separate from conversation handling.`] },
    { id: 'lessbusy-overdue', label: msg`Which invoices are overdue?`, Icon: IconFileText, mode: 'SEND', prompts: [msg`Show authorized overdue customer invoices and their outstanding balances. Keep currencies separate and say if results are limited.`] },
    { id: 'lessbusy-low-stock', label: msg`Check low stock`, Icon: IconSearch, mode: 'SEND', prompts: [msg`Check a bounded batch of authorized stock balances for low-stock items. Explain whether more inventory remains to be checked.`] },
  ];
};

import { inngest } from './inngest';
import { syncNotionPage } from './sync-notion-page';

export const syncNotionPageFn = inngest.createFunction(
  {
    id: 'sync-notion-page',
    retries: 3,
    debounce: { period: '10s', key: 'event.data.pageId' },
    triggers: [{ event: 'notion/page.updated' }],
  },
  async ({ event, step }) => {
    const { pageId } = event.data;

    const result = await step.run('sync-to-supabase', () => syncNotionPage(pageId));

    return result;
  }
);

import { inngest } from './inngest';
import { syncNotionPage } from './sync-notion-page';

export const syncNotionPageFn = inngest.createFunction(
  {
    id: 'sync-notion-page',
    retries: 3,
    // Deduplicate: if the same page fires multiple events quickly, only run once
    debounce: { period: '10s', key: 'event.data.pageId' },
  },
  { event: 'notion/page.updated' },
  async ({ event, step }) => {
    const { pageId } = event.data;

    const result = await step.run('sync-to-supabase', () => syncNotionPage(pageId));

    return result;
  }
);

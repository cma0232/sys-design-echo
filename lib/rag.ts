import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { embed } from 'ai';
import { createClient } from '@supabase/supabase-js';

export async function retrieveKnowledge(query: string, matchCount = 6): Promise<string> {
  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY! });
  const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { embedding } = await embed({
    model: google.textEmbeddingModel('gemini-embedding-001'),
    value: query,
  });

  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: embedding,
    match_threshold: 0.4,
    match_count: matchCount,
  });

  if (error || !data?.length) return '';

  return data
    .map((item: any) => `### ${item.title}\n${item.content}`)
    .join('\n\n---\n\n');
}

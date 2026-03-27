-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Create knowledge embeddings table
-- Google text-embedding-004 produces 768-dimensional vectors
create table if not exists knowledge_embeddings (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  title text not null,
  chunk_index integer not null,
  content text not null,
  embedding vector(3072),
  tags text[],
  active_dimensions text[],
  source text,
  created_at timestamp with time zone default now()
);

-- 3. Create index for fast similarity search
create index if not exists knowledge_embeddings_embedding_idx
  on knowledge_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- 4. Match function for RAG retrieval
create or replace function match_knowledge (
  query_embedding vector(3072),
  match_threshold float default 0.5,
  match_count int default 5
)
returns table (
  id uuid,
  filename text,
  title text,
  chunk_index integer,
  content text,
  tags text[],
  active_dimensions text[],
  similarity float
)
language sql stable
as $$
  select
    id,
    filename,
    title,
    chunk_index,
    content,
    tags,
    active_dimensions,
    1 - (embedding <=> query_embedding) as similarity
  from knowledge_embeddings
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

# Database Schema Documentation

This document outlines the PostgreSQL database schema implemented in Supabase for the FocusAI project.

## Tables

### projects

Stores information about user projects including metadata, timeline, and documentation.

```sql
CREATE TABLE public.projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    client_name text,
    description text,
    start_date date,
    end_date date,
    budget numeric,
    priority_score numeric DEFAULT 0,
    documentation jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
```

### notes

Stores user notes that can be general or associated with specific projects.

```sql
CREATE TABLE public.notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
```

### tasks

Stores tasks associated with projects.

```sql
CREATE TABLE public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description text NOT NULL,
    estimated_time numeric NOT NULL,
    due_date date,
    status text DEFAULT 'pending'::text,
    priority_score numeric DEFAULT 0,
    stage text,
    actual_time numeric,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_status CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
```

### user_settings

Stores user preferences, skills, and workflow configuration.

```sql
CREATE TABLE public.user_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    skills jsonb DEFAULT '{}'::jsonb,
    time_estimates jsonb DEFAULT '{}'::jsonb,
    workflow jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
```

### notes_embeddings

Stores OpenAI vector embeddings for notes to enable semantic search.

```sql
CREATE TABLE public.notes_embeddings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE UNIQUE,
    embedding vector(1536),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notes_embeddings ENABLE ROW LEVEL SECURITY;
```

### ai_context

Stores AI context information for user interactions.

```sql
CREATE TABLE public.ai_context (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    context_summary text,
    last_updated timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_context ENABLE ROW LEVEL SECURITY;
```

## Row Level Security (RLS) Policies

### projects Policies

```sql
-- Users can create their own projects
CREATE POLICY "Users can create their own projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (uid() = user_id);

-- Users can view their own projects
CREATE POLICY "Users can view their own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update their own projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
ON public.projects
FOR DELETE
TO authenticated
USING (uid() = user_id);
```

### notes Policies

```sql
-- Users can CRUD their own notes
CREATE POLICY "Users can CRUD their own notes"
ON public.notes
FOR ALL
TO public
USING (uid() = user_id);
```

### tasks Policies

```sql
-- Users can CRUD tasks in their projects
CREATE POLICY "Users can CRUD tasks in their projects"
ON public.tasks
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM projects
    WHERE (projects.id = tasks.project_id) AND (projects.user_id = uid())
  )
);
```

### user_settings Policies

```sql
-- Users can CRUD their own settings
CREATE POLICY "Users can CRUD their own settings"
ON public.user_settings
FOR ALL
TO public
USING (uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
TO authenticated
WITH CHECK (uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
TO authenticated
USING (uid() = user_id)
WITH CHECK (uid() = user_id);

-- Users can view their own settings
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
TO authenticated
USING (uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete their own settings"
ON public.user_settings
FOR DELETE
TO authenticated
USING (uid() = user_id);
```

### notes_embeddings Policies

```sql
-- Users can query embeddings for their notes
CREATE POLICY "Users can query embeddings for their notes"
ON public.notes_embeddings
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM notes
    WHERE (notes.id = notes_embeddings.note_id) AND (notes.user_id = uid())
  )
);
```

### ai_context Policies

```sql
-- Users can access their own AI context
CREATE POLICY "Users can access their own AI context"
ON public.ai_context
FOR ALL
TO public
USING (uid() = user_id);
```

## Indexes

### projects Indexes

```sql
CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (id);
```

### notes Indexes

```sql
CREATE UNIQUE INDEX notes_pkey ON public.notes USING btree (id);
```

### tasks Indexes

```sql
CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id);
```

### user_settings Indexes

```sql
CREATE UNIQUE INDEX user_settings_pkey ON public.user_settings USING btree (id);
CREATE UNIQUE INDEX user_settings_user_id_key ON public.user_settings USING btree (user_id);
```

### notes_embeddings Indexes

```sql
CREATE UNIQUE INDEX notes_embeddings_pkey ON public.notes_embeddings USING btree (id);
CREATE UNIQUE INDEX notes_embeddings_note_id_key ON public.notes_embeddings USING btree (note_id);
```

### ai_context Indexes

```sql
CREATE UNIQUE INDEX ai_context_pkey ON public.ai_context USING btree (id);
CREATE UNIQUE INDEX ai_context_user_id_key ON public.ai_context USING btree (user_id);
```

## Triggers

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects table
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger for notes table
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger for tasks table
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger for user_settings table
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger for notes_embeddings table
CREATE TRIGGER update_notes_embeddings_updated_at
BEFORE UPDATE ON public.notes_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

## Vector Search Function

```sql
-- Function to match notes based on vector similarity
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    notes.id,
    notes.content,
    1 - (notes_embeddings.embedding <=> query_embedding) AS similarity
  FROM notes
  JOIN notes_embeddings ON notes.id = notes_embeddings.note_id
  WHERE 1 - (notes_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
```
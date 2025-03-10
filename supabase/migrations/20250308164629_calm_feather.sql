/*
  # Initial Schema Setup for Focus AI

  1. Extensions
    - Enable pgvector for note embeddings and similarity search
    - Add trigger functions for automatic timestamp updates

  2. Tables
    - Projects: Store project details and metadata
    - Notes: Store user notes with optional project linking
    - Tasks: Store project tasks with AI-driven priority
    - UserSettings: Store user preferences and workflow settings
    - NotesEmbeddings: Store vector embeddings for notes
    - AIContext: Store user-specific AI context

  3. Security
    - Enable RLS on all tables
    - Add policies for user data isolation
    - Set up foreign key constraints
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS "vector";

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  client_name text,
  description text,
  start_date date,
  end_date date,
  budget numeric,
  priority_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own projects"
  ON projects
  USING (auth.uid() = user_id);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own notes"
  ON notes
  USING (auth.uid() = user_id);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  estimated_time numeric NOT NULL,
  due_date date,
  status text DEFAULT 'pending',
  priority_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD tasks in their projects"
  ON tasks
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- UserSettings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  skills jsonb DEFAULT '{}',
  time_estimates jsonb DEFAULT '{}',
  workflow jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own settings"
  ON user_settings
  USING (auth.uid() = user_id);

-- NotesEmbeddings table
CREATE TABLE IF NOT EXISTS notes_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL UNIQUE,
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER update_notes_embeddings_updated_at
  BEFORE UPDATE ON notes_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE notes_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can query embeddings for their notes"
  ON notes_embeddings
  USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = notes_embeddings.note_id
      AND notes.user_id = auth.uid()
    )
  );

-- AIContext table
CREATE TABLE IF NOT EXISTS ai_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  context_summary text,
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE ai_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own AI context"
  ON ai_context
  USING (auth.uid() = user_id);
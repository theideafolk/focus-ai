/*
  # Add RLS policies for user settings

  1. Security
    - Enable RLS on user_settings table
    - Add policies for users to:
      - Insert their own settings
      - Read their own settings
      - Update their own settings
      - Delete their own settings
*/

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own settings"
ON user_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings"
ON user_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON user_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
ON user_settings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
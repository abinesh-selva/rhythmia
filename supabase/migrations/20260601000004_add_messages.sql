-- Create the messages table
CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow users to read messages they sent or received
CREATE POLICY "Users can read their own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Allow users to insert messages they send
CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Enable realtime broadcasts for the messages table
-- NOTE: In your Supabase Dashboard, you may also need to go to Database -> Replication -> Click "0 tables" under Source -> Toggle "messages" ON.
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

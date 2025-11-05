-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
                                            id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
                                            email TEXT NOT NULL UNIQUE,
                                            full_name TEXT,
                                            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own data"
  ON public.users
  FOR SELECT
                 USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON public.users
  FOR UPDATE
                 USING (auth.uid() = id);

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
INSERT INTO public.users (id, email)
VALUES (NEW.id, NEW.email);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to handle new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
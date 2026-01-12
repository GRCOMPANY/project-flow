-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'colaborador');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'colaborador',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Add assigned_to column to tasks
ALTER TABLE public.tasks ADD COLUMN assigned_to UUID REFERENCES public.profiles(id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Trigger function to create profile and assign default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', 'Usuario'),
    new.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data ->> 'role')::app_role, 'colaborador')
  );
  
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Authenticated users can view roles"
ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing permissive policies on projects
DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;

-- New RLS Policies for projects
CREATE POLICY "Authenticated can view projects"
ON public.projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert projects"
ON public.projects FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update projects"
ON public.projects FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Only admins can delete projects"
ON public.projects FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing permissive policies on tasks
DROP POLICY IF EXISTS "Allow all access to tasks" ON public.tasks;

-- New RLS Policies for tasks
CREATE POLICY "Authenticated can view tasks"
ON public.tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can insert tasks"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and assigned users can update tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete tasks"
ON public.tasks FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
-- Fix permissive INSERT policy on projects - require authenticated user
DROP POLICY IF EXISTS "Authenticated can insert projects" ON public.projects;
CREATE POLICY "Authenticated can insert projects"
ON public.projects FOR INSERT TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix permissive UPDATE policy on projects - require authenticated user  
DROP POLICY IF EXISTS "Authenticated can update projects" ON public.projects;
CREATE POLICY "Authenticated can update projects"
ON public.projects FOR UPDATE TO authenticated 
USING (auth.uid() IS NOT NULL);
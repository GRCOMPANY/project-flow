
-- ================================================
-- MULTI-TENANT MIGRATION
-- ================================================

-- 1. Create ENUM for company roles
CREATE TYPE public.company_role AS ENUM ('owner', 'admin', 'collaborator', 'seller');

-- 2. Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  linked_to_grc BOOLEAN NOT NULL DEFAULT false,
  is_grc BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 3. Create company_users table
CREATE TABLE public.company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role company_role NOT NULL DEFAULT 'collaborator',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- 4. Create company_products table (GRC catalog link)
CREATE TABLE public.company_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  cost_price NUMERIC DEFAULT 0,
  wholesale_price NUMERIC DEFAULT 0,
  retail_price NUMERIC DEFAULT 0,
  status public.product_status NOT NULL DEFAULT 'activo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, source_product_id)
);
ALTER TABLE public.company_products ENABLE ROW LEVEL SECURITY;

-- 5. Add company_id to all operational tables (nullable first for migration)
ALTER TABLE public.products ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.sales ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.creatives ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.sellers ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.suppliers ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.tasks ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.projects ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.creative_automation_intents ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- 6. Create GRC company with existing admin user
INSERT INTO public.companies (id, name, owner_user_id, plan, is_grc, linked_to_grc)
VALUES ('00000000-0000-0000-0000-000000000001', 'GRC', 'd4c2a133-f11a-42e0-81c0-bcfa0265d940', 'enterprise', true, true);

-- 7. Assign admin as owner of GRC company
INSERT INTO public.company_users (user_id, company_id, role, status)
VALUES ('d4c2a133-f11a-42e0-81c0-bcfa0265d940', '00000000-0000-0000-0000-000000000001', 'owner', 'active');

-- 8. Migrate all existing data to GRC company
UPDATE public.products SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.sales SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.creatives SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.sellers SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.suppliers SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.tasks SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.projects SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.creative_automation_intents SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;

-- 9. Create indexes on company_id for performance
CREATE INDEX idx_products_company_id ON public.products(company_id);
CREATE INDEX idx_sales_company_id ON public.sales(company_id);
CREATE INDEX idx_creatives_company_id ON public.creatives(company_id);
CREATE INDEX idx_sellers_company_id ON public.sellers(company_id);
CREATE INDEX idx_suppliers_company_id ON public.suppliers(company_id);
CREATE INDEX idx_tasks_company_id ON public.tasks(company_id);
CREATE INDEX idx_projects_company_id ON public.projects(company_id);
CREATE INDEX idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX idx_company_users_company_id ON public.company_users(company_id);

-- 10. Create security functions
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id 
  FROM public.company_users 
  WHERE user_id = auth.uid() 
    AND status = 'active'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = auth.uid()
      AND company_id = _company_id
      AND status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_company_role(_company_id UUID, _role company_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = auth.uid()
      AND company_id = _company_id
      AND role = _role
      AND status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = auth.uid()
      AND company_id = _company_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
  )
$$;

-- 11. Drop ALL existing RLS policies

-- products
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;

-- sales
DROP POLICY IF EXISTS "Admins can delete sales" ON public.sales;
DROP POLICY IF EXISTS "Admins can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Admins can update sales" ON public.sales;
DROP POLICY IF EXISTS "Users can view their own or all sales if admin" ON public.sales;

-- creatives
DROP POLICY IF EXISTS "Admins can delete creatives" ON public.creatives;
DROP POLICY IF EXISTS "Admins can insert creatives" ON public.creatives;
DROP POLICY IF EXISTS "Admins can update creatives" ON public.creatives;
DROP POLICY IF EXISTS "Authenticated users can view creatives" ON public.creatives;

-- creative_files
DROP POLICY IF EXISTS "Admins can delete creative files" ON public.creative_files;
DROP POLICY IF EXISTS "Admins can insert creative files" ON public.creative_files;
DROP POLICY IF EXISTS "Admins can update creative files" ON public.creative_files;
DROP POLICY IF EXISTS "Authenticated can view creative files" ON public.creative_files;

-- sellers
DROP POLICY IF EXISTS "Admins can delete sellers" ON public.sellers;
DROP POLICY IF EXISTS "Admins can insert sellers" ON public.sellers;
DROP POLICY IF EXISTS "Admins can update sellers" ON public.sellers;
DROP POLICY IF EXISTS "Authenticated users can view sellers" ON public.sellers;

-- suppliers
DROP POLICY IF EXISTS "Admins can delete suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;

-- tasks
DROP POLICY IF EXISTS "Admins and assigned users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Only admins can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Only admins can insert tasks" ON public.tasks;

-- projects
DROP POLICY IF EXISTS "Authenticated can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated can view projects" ON public.projects;
DROP POLICY IF EXISTS "Only admins can delete projects" ON public.projects;

-- creative_automation_intents
DROP POLICY IF EXISTS "Admins can manage intents" ON public.creative_automation_intents;
DROP POLICY IF EXISTS "Authenticated can view intents" ON public.creative_automation_intents;

-- task_outcomes
DROP POLICY IF EXISTS "Admins can insert outcomes" ON public.task_outcomes;
DROP POLICY IF EXISTS "Admins can update outcomes" ON public.task_outcomes;
DROP POLICY IF EXISTS "Authenticated users can view outcomes" ON public.task_outcomes;

-- 12. Create new multi-tenant RLS policies

-- === COMPANIES ===
CREATE POLICY "Users see their companies"
ON public.companies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_users
    WHERE company_users.user_id = auth.uid()
      AND company_users.company_id = companies.id
      AND company_users.status = 'active'
  )
);

CREATE POLICY "Users can update their own companies"
ON public.companies FOR UPDATE
USING (is_company_admin(id));

-- === COMPANY_USERS ===
CREATE POLICY "Users see members of their companies"
ON public.company_users FOR SELECT
USING (user_belongs_to_company(company_id));

CREATE POLICY "Company admins can manage members"
ON public.company_users FOR INSERT
WITH CHECK (is_company_admin(company_id));

CREATE POLICY "Company admins can update members"
ON public.company_users FOR UPDATE
USING (is_company_admin(company_id));

CREATE POLICY "Company admins can remove members"
ON public.company_users FOR DELETE
USING (is_company_admin(company_id));

-- === COMPANY_PRODUCTS ===
CREATE POLICY "Users see their company products"
ON public.company_products FOR SELECT
USING (user_belongs_to_company(company_id));

CREATE POLICY "Company admins can manage company products"
ON public.company_products FOR INSERT
WITH CHECK (is_company_admin(company_id));

CREATE POLICY "Company admins can update company products"
ON public.company_products FOR UPDATE
USING (is_company_admin(company_id));

CREATE POLICY "Company admins can delete company products"
ON public.company_products FOR DELETE
USING (is_company_admin(company_id));

-- === PRODUCTS ===
CREATE POLICY "Users see own company products"
ON public.products FOR SELECT
USING (
  user_belongs_to_company(company_id)
  OR (
    -- GRC products visible to linked companies
    EXISTS (SELECT 1 FROM public.companies WHERE id = products.company_id AND is_grc = true)
    AND EXISTS (
      SELECT 1 FROM public.company_users cu
      JOIN public.companies c ON c.id = cu.company_id
      WHERE cu.user_id = auth.uid()
        AND c.linked_to_grc = true
        AND cu.status = 'active'
    )
  )
);

CREATE POLICY "Company admins can insert products"
ON public.products FOR INSERT
WITH CHECK (is_company_admin(company_id));

CREATE POLICY "Company admins can update products"
ON public.products FOR UPDATE
USING (is_company_admin(company_id));

CREATE POLICY "Company owners can delete products"
ON public.products FOR DELETE
USING (has_company_role(company_id, 'owner') OR is_company_admin(company_id));

-- === SALES ===
CREATE POLICY "Users see own company sales"
ON public.sales FOR SELECT
USING (user_belongs_to_company(company_id));

CREATE POLICY "Company admins can insert sales"
ON public.sales FOR INSERT
WITH CHECK (is_company_admin(company_id));

CREATE POLICY "Company admins can update sales"
ON public.sales FOR UPDATE
USING (is_company_admin(company_id));

CREATE POLICY "Company admins can delete sales"
ON public.sales FOR DELETE
USING (is_company_admin(company_id));

-- === CREATIVES ===
CREATE POLICY "Users see own company creatives"
ON public.creatives FOR SELECT
USING (user_belongs_to_company(company_id));

CREATE POLICY "Company admins can insert creatives"
ON public.creatives FOR INSERT
WITH CHECK (is_company_admin(company_id));

CREATE POLICY "Company admins can update creatives"
ON public.creatives FOR UPDATE
USING (is_company_admin(company_id));

CREATE POLICY "Company admins can delete creatives"
ON public.creatives FOR DELETE
USING (is_company_admin(company_id));

-- === CREATIVE_FILES (inherits via creative) ===
CREATE POLICY "Users see creative files of own company"
ON public.creative_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.creatives c
    WHERE c.id = creative_files.creative_id
      AND user_belongs_to_company(c.company_id)
  )
);

CREATE POLICY "Company admins can insert creative files"
ON public.creative_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.creatives c
    WHERE c.id = creative_files.creative_id
      AND is_company_admin(c.company_id)
  )
);

CREATE POLICY "Company admins can update creative files"
ON public.creative_files FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.creatives c
    WHERE c.id = creative_files.creative_id
      AND is_company_admin(c.company_id)
  )
);

CREATE POLICY "Company admins can delete creative files"
ON public.creative_files FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.creatives c
    WHERE c.id = creative_files.creative_id
      AND is_company_admin(c.company_id)
  )
);

-- === SELLERS ===
CREATE POLICY "Users see own company sellers"
ON public.sellers FOR SELECT
USING (user_belongs_to_company(company_id));

CREATE POLICY "Company admins can insert sellers"
ON public.sellers FOR INSERT
WITH CHECK (is_company_admin(company_id));

CREATE POLICY "Company admins can update sellers"
ON public.sellers FOR UPDATE
USING (is_company_admin(company_id));

CREATE POLICY "Company admins can delete sellers"
ON public.sellers FOR DELETE
USING (is_company_admin(company_id));

-- === SUPPLIERS ===
CREATE POLICY "Users see own company suppliers"
ON public.suppliers FOR SELECT
USING (user_belongs_to_company(company_id));

CREATE POLICY "Company admins can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (is_company_admin(company_id));

CREATE POLICY "Company admins can update suppliers"
ON public.suppliers FOR UPDATE
USING (is_company_admin(company_id));

CREATE POLICY "Company admins can delete suppliers"
ON public.suppliers FOR DELETE
USING (is_company_admin(company_id));

-- === TASKS ===
CREATE POLICY "Users see own company tasks"
ON public.tasks FOR SELECT
USING (user_belongs_to_company(company_id));

CREATE POLICY "Company admins can insert tasks"
ON public.tasks FOR INSERT
WITH CHECK (is_company_admin(company_id));

CREATE POLICY "Company admins and assigned can update tasks"
ON public.tasks FOR UPDATE
USING (
  user_belongs_to_company(company_id)
  AND (assigned_to = auth.uid() OR is_company_admin(company_id))
);

CREATE POLICY "Company admins can delete tasks"
ON public.tasks FOR DELETE
USING (is_company_admin(company_id));

-- === TASK_OUTCOMES (inherits via task) ===
CREATE POLICY "Users see outcomes of own company tasks"
ON public.task_outcomes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_outcomes.task_id
      AND user_belongs_to_company(t.company_id)
  )
);

CREATE POLICY "Company admins can insert outcomes"
ON public.task_outcomes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_outcomes.task_id
      AND is_company_admin(t.company_id)
  )
);

CREATE POLICY "Company admins can update outcomes"
ON public.task_outcomes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_outcomes.task_id
      AND is_company_admin(t.company_id)
  )
);

-- === PROJECTS ===
CREATE POLICY "Users see own company projects"
ON public.projects FOR SELECT
USING (user_belongs_to_company(company_id));

CREATE POLICY "Company members can insert projects"
ON public.projects FOR INSERT
WITH CHECK (user_belongs_to_company(company_id));

CREATE POLICY "Company members can update projects"
ON public.projects FOR UPDATE
USING (user_belongs_to_company(company_id));

CREATE POLICY "Company admins can delete projects"
ON public.projects FOR DELETE
USING (is_company_admin(company_id));

-- === CREATIVE_AUTOMATION_INTENTS ===
CREATE POLICY "Users see own company intents"
ON public.creative_automation_intents FOR SELECT
USING (user_belongs_to_company(company_id));

CREATE POLICY "Company admins can manage intents"
ON public.creative_automation_intents FOR ALL
USING (is_company_admin(company_id));

-- === PROFILES (keep existing - no company_id needed) ===
-- Profiles remain accessible to all authenticated users

-- === USER_ROLES (keep existing for legacy compatibility) ===

-- 13. Update handle_new_user trigger to create company on registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- 1. Create profile
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', 'Usuario'),
    new.email
  );
  
  -- 2. Create legacy role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data ->> 'role')::app_role, 'colaborador')
  );
  
  -- 3. Create company for user
  INSERT INTO public.companies (name, owner_user_id, plan)
  VALUES (
    COALESCE(
      new.raw_user_meta_data ->> 'company_name',
      COALESCE(new.raw_user_meta_data ->> 'full_name', 'Mi Empresa')
    ),
    new.id,
    'free'
  )
  RETURNING id INTO new_company_id;
  
  -- 4. Assign user as owner
  INSERT INTO public.company_users (user_id, company_id, role, status)
  VALUES (new.id, new_company_id, 'owner', 'active');
  
  RETURN new;
END;
$$;

-- 14. Trigger for updated_at on new tables
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_products_updated_at
BEFORE UPDATE ON public.company_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

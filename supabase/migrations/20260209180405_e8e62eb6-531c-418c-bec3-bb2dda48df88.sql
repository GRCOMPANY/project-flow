
-- Fix circular RLS on company_users
DROP POLICY IF EXISTS "Users see members of their companies" ON company_users;
CREATE POLICY "Users see members of their companies" 
ON company_users FOR SELECT
USING (
  company_id IN (
    SELECT cu.company_id FROM company_users cu 
    WHERE cu.user_id = auth.uid() AND cu.status = 'active'
  )
);

-- Fix RLS on companies
DROP POLICY IF EXISTS "Users see their companies" ON companies;
CREATE POLICY "Users see their companies" 
ON companies FOR SELECT
USING (
  id IN (
    SELECT cu.company_id FROM company_users cu 
    WHERE cu.user_id = auth.uid() AND cu.status = 'active'
  )
);

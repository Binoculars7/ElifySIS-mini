-- ElifySIS Supabase Schema Initialization
-- Copy and run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Users Table (Profile data linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY REFERENCES auth.users(id),
    "businessId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CASHIER',
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" BIGINT NOT NULL
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS "categories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- 3. Expense Categories Table
CREATE TABLE IF NOT EXISTS "expenseCategories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS "products" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER DEFAULT 0,
    "buyPrice" NUMERIC(15, 2) DEFAULT 0,
    "sellPrice" NUMERIC(15, 2) DEFAULT 0,
    "category" TEXT,
    "supplierId" TEXT,
    "lastUpdated" BIGINT
);

-- 5. Customers Table
CREATE TABLE IF NOT EXISTS "customers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" BIGINT NOT NULL
);

-- 6. Employees Table
CREATE TABLE IF NOT EXISTS "employees" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "jobRole" TEXT,
    "hiredDate" TEXT,
    "address" TEXT,
    "createdAt" BIGINT NOT NULL
);

-- 7. Suppliers Table
CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" BIGINT NOT NULL
);

-- 8. Sales Table
CREATE TABLE IF NOT EXISTS "sales" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "totalAmount" NUMERIC(15, 2) DEFAULT 0,
    "date" BIGINT NOT NULL,
    "paymentMethod" TEXT,
    "status" TEXT DEFAULT 'Pending'
);

-- 9. Expenses Table
CREATE TABLE IF NOT EXISTS "expenses" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" NUMERIC(15, 2) DEFAULT 0,
    "date" BIGINT NOT NULL,
    "category" TEXT
);

-- 10. Stock Logs Table
CREATE TABLE IF NOT EXISTS "stockLogs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "change" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "date" BIGINT NOT NULL,
    "balance" INTEGER NOT NULL
);

-- 11. Settings Table
CREATE TABLE IF NOT EXISTS "settings" (
    "businessId" TEXT PRIMARY KEY,
    "currency" TEXT DEFAULT 'USD',
    "currencySymbol" TEXT DEFAULT '$'
);

-- 12. Notifications Table
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "type" TEXT DEFAULT 'info',
    "read" BOOLEAN DEFAULT FALSE,
    "timestamp" BIGINT NOT NULL
);

-- ENABLE RLS (Optional but Recommended)
-- Note: You will need to add specific policies if you enable this.
-- ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
-- ... etc.
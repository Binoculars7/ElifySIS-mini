
-- ElifySIS Supabase Schema Initialization
-- Run this in your Supabase SQL Editor

-- 1. CLEANUP & UPDATES
ALTER TABLE IF EXISTS "users" DROP CONSTRAINT IF EXISTS "users_id_fkey";
ALTER TABLE IF EXISTS "users" DROP CONSTRAINT IF EXISTS "users_id_fkey1";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT, -- Used for staff/hybrid login
    "role" TEXT NOT NULL DEFAULT 'CASHIER',
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" BIGINT NOT NULL
);

-- 3. SECURITY: Enable RLS but add a Public Access Policy for Login
-- This allows the 'anon' role to check credentials in the public table
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON "users";
CREATE POLICY "Enable read access for all users" ON "users" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON "users";
CREATE POLICY "Enable insert for all users" ON "users" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON "users";
CREATE POLICY "Enable update for all users" ON "users" FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON "users";
CREATE POLICY "Enable delete for all users" ON "users" FOR DELETE USING (true);

-- 4. Other Tables (Standard initialization)
CREATE TABLE IF NOT EXISTS "categories" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "name" TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "expenseCategories" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "name" TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "products" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "quantity" INTEGER DEFAULT 0, "buyPrice" NUMERIC(15, 2) DEFAULT 0, "sellPrice" NUMERIC(15, 2) DEFAULT 0, "category" TEXT, "supplierId" TEXT, "lastUpdated" BIGINT);
CREATE TABLE IF NOT EXISTS "customers" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL, "phone" TEXT, "email" TEXT, "address" TEXT, "createdAt" BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS "employees" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL, "gender" TEXT, "email" TEXT, "phone" TEXT, "jobRole" TEXT, "hiredDate" TEXT, "address" TEXT, "createdAt" BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS "suppliers" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "name" TEXT NOT NULL, "phone" TEXT, "address" TEXT, "createdAt" BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS "sales" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "ticketId" TEXT NOT NULL, "customerId" TEXT, "customerName" TEXT, "items" JSONB NOT NULL DEFAULT '[]'::jsonb, "totalAmount" NUMERIC(15, 2) DEFAULT 0, "date" BIGINT NOT NULL, "paymentMethod" TEXT, "status" TEXT DEFAULT 'Pending');
CREATE TABLE IF NOT EXISTS "expenses" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "name" TEXT NOT NULL, "amount" NUMERIC(15, 2) DEFAULT 0, "date" BIGINT NOT NULL, "category" TEXT);
CREATE TABLE IF NOT EXISTS "stockLogs" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "productId" TEXT NOT NULL, "productName" TEXT NOT NULL, "change" INTEGER NOT NULL, "type" TEXT NOT NULL, "date" BIGINT NOT NULL, "balance" INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS "settings" ("businessId" TEXT PRIMARY KEY, "currency" TEXT DEFAULT 'USD', "currencySymbol" TEXT DEFAULT '$');
CREATE TABLE IF NOT EXISTS "notifications" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "businessId" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT, "type" TEXT DEFAULT 'info', "read" BOOLEAN DEFAULT FALSE, "timestamp" BIGINT NOT NULL);

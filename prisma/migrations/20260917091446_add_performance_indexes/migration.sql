-- CreateIndex
CREATE INDEX "claim_requests_branchId_status_idx" ON "claim_requests"("branchId", "status");

-- CreateIndex
CREATE INDEX "claim_requests_customerId_createdAt_idx" ON "claim_requests"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "claim_requests_warrantyId_status_idx" ON "claim_requests"("warrantyId", "status");

-- CreateIndex
CREATE INDEX "claim_requests_status_createdAt_idx" ON "claim_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "claim_requests_inventoryItemId_idx" ON "claim_requests"("inventoryItemId");

-- CreateIndex
CREATE INDEX "employees_branchId_isActive_idx" ON "employees"("branchId", "isActive");

-- CreateIndex
CREATE INDEX "payments_saleId_idx" ON "payments"("saleId");

-- CreateIndex
CREATE INDEX "products_brandId_idx" ON "products"("brandId");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchaseOrderId_idx" ON "purchase_order_items"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "purchase_order_items_productId_idx" ON "purchase_order_items"("productId");

-- CreateIndex
CREATE INDEX "purchase_orders_branchId_orderDate_idx" ON "purchase_orders"("branchId", "orderDate");

-- CreateIndex
CREATE INDEX "purchase_orders_employeeId_orderDate_idx" ON "purchase_orders"("employeeId", "orderDate");

-- CreateIndex
CREATE INDEX "purchase_orders_supplierId_orderDate_idx" ON "purchase_orders"("supplierId", "orderDate");

-- CreateIndex
CREATE INDEX "purchase_orders_status_orderDate_idx" ON "purchase_orders"("status", "orderDate");

-- CreateIndex
CREATE INDEX "repair_job_parts_repairJobId_idx" ON "repair_job_parts"("repairJobId");

-- CreateIndex
CREATE INDEX "repair_job_parts_productId_idx" ON "repair_job_parts"("productId");

-- CreateIndex
CREATE INDEX "repair_jobs_customerId_receivedAt_idx" ON "repair_jobs"("customerId", "receivedAt");

-- CreateIndex
CREATE INDEX "repair_jobs_status_receivedAt_idx" ON "repair_jobs"("status", "receivedAt");

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- CreateIndex
CREATE INDEX "sale_items_productId_idx" ON "sale_items"("productId");

-- CreateIndex
CREATE INDEX "sales_branchId_createdAt_idx" ON "sales"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "sales_employeeId_createdAt_idx" ON "sales"("employeeId", "createdAt");

-- CreateIndex
CREATE INDEX "sales_customerId_idx" ON "sales"("customerId");

-- CreateIndex
CREATE INDEX "sales_status_createdAt_idx" ON "sales"("status", "createdAt");

-- CreateIndex
CREATE INDEX "sales_createdAt_idx" ON "sales"("createdAt");

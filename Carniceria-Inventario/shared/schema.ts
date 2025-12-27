
import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit").notNull(), // 'kg', 'lb', 'unit'
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default('0'),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull().default('0'), // Precio de costo por unidad
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }).notNull().default('0'), // Precio de venta sugerido
  minStock: numeric("min_stock", { precision: 10, scale: 2 }).default('5'), // Alerta de stock bajo
  isActive: boolean("is_active").default(true),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(), // Precio final de la venta
  soldAt: timestamp("sold_at").defaultNow(),
});

// === RELATIONS ===
export const salesRelations = relations(sales, ({ one }) => ({
  product: one(products, {
    fields: [sales.productId],
    references: [products.id],
  }),
}));

// === SCHEMAS ===
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, soldAt: true });

// === TYPES ===
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

// Request types
export type CreateProductRequest = InsertProduct;
export type UpdateProductRequest = Partial<InsertProduct>;
export type CreateSaleRequest = InsertSale;

// Joined type for frontend display
export type SaleWithProduct = Sale & { product: Product };

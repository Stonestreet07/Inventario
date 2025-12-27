
import { db } from "./db";
import {
  products,
  sales,
  type Product,
  type InsertProduct,
  type UpdateProductRequest,
  type Sale,
  type InsertSale,
  type SaleWithProduct
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: UpdateProductRequest): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Sales
  getSales(): Promise<SaleWithProduct[]>;
  createSale(sale: InsertSale): Promise<Sale>;
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(products.name);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, updates: UpdateProductRequest): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    // In a real app we might soft-delete, but for now hard delete
    await db.delete(products).where(eq(products.id, id));
  }

  // Sales
  async getSales(): Promise<SaleWithProduct[]> {
    return await db.query.sales.findMany({
      with: {
        product: true
      },
      orderBy: [desc(sales.soldAt)]
    });
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    // Transaction to ensure stock is updated
    return await db.transaction(async (tx) => {
      // 1. Check stock
      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, insertSale.productId));

      if (!product) {
        throw new Error("Product not found");
      }

      // Convert to numbers for calculation
      const currentQty = Number(product.quantity);
      const soldQty = Number(insertSale.quantity);

      if (currentQty < soldQty) {
         throw new Error(`Insufficient stock. Available: ${currentQty}, Requested: ${soldQty}`);
      }

      // 2. Decrement stock
      await tx
        .update(products)
        .set({ 
          quantity: sql`${products.quantity} - ${insertSale.quantity}` 
        })
        .where(eq(products.id, insertSale.productId));

      // 3. Create sale record
      const [sale] = await tx.insert(sales).values(insertSale).returning();
      return sale;
    });
  }
}

export const storage = new DatabaseStorage();

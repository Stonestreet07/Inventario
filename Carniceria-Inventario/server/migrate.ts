import { db } from "./db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  try {
    console.log("Checking if tables exist...");
    
    // Try to query products table to see if it exists
    await db.execute(sql`SELECT 1 FROM "products" LIMIT 1`);
    console.log("Tables already exist!");
    return;
  } catch (err: any) {
    if (err.code === '42P01') { // Table doesn't exist error
      console.log("Tables don't exist, creating them...");
      
      try {
        // Create products table
        await db.execute(sql`
          CREATE TABLE "products" (
            "id" serial PRIMARY KEY NOT NULL,
            "name" text NOT NULL,
            "description" text,
            "unit" text NOT NULL,
            "quantity" numeric(10, 2) DEFAULT '0' NOT NULL,
            "cost_price" numeric(10, 2) DEFAULT '0' NOT NULL,
            "sale_price" numeric(10, 2) DEFAULT '0' NOT NULL,
            "min_stock" numeric(10, 2) DEFAULT '5',
            "is_active" boolean DEFAULT true
          )
        `);
        console.log("Created products table");

        // Create sales table
        await db.execute(sql`
          CREATE TABLE "sales" (
            "id" serial PRIMARY KEY NOT NULL,
            "product_id" integer NOT NULL,
            "quantity" numeric(10, 2) NOT NULL,
            "total_price" numeric(10, 2) NOT NULL,
            "sold_at" timestamp DEFAULT now()
          )
        `);
        console.log("Created sales table");

        // Add foreign key
        await db.execute(sql`
          ALTER TABLE "sales" ADD CONSTRAINT "sales_product_id_products_id_fk" 
          FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") 
          ON DELETE no action ON UPDATE no action
        `);
        console.log("Added foreign key constraint");
        console.log("Database migration completed successfully!");
      } catch (createErr) {
        console.error("Error creating tables:", createErr);
        throw createErr;
      }
    } else {
      // Some other database error
      console.error("Database error:", err);
      throw err;
    }
  }
}

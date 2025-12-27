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
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"sold_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
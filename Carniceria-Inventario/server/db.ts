import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// COMENTA la línea original y PEGA tu URL de Neon directamente
// const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
const databaseUrl = "postgresql://neondb_owner:npg_liwL0jcsnEu1@ep-small-dawn-admt593w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

if (!databaseUrl) {
  throw new Error("No se encontró la URL de la base de datos.");
}

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: true // Forzamos SSL para Neon
});

export const db = drizzle(pool, { schema });


import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import ExcelJS from "exceljs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Products ===
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(product);
  });

  app.post(api.products.create.path, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.products.update.path, async (req, res) => {
    try {
      const input = api.products.update.input.parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), input);
      if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
      res.json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.products.delete.path, async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.status(204).send();
  });

  // === Sales ===
  app.get(api.sales.list.path, async (req, res) => {
    const sales = await storage.getSales();
    res.json(sales);
  });

  app.post(api.sales.create.path, async (req, res) => {
    try {
      const input = api.sales.create.input.parse(req.body);
      const sale = await storage.createSale(input);
      res.status(201).json(sale);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      if (err instanceof Error && err.message.includes("Insufficient stock")) {
        return res.status(422).json({ message: err.message });
      }
      throw err;
    }
  });

  // === End of Day Report ===
  app.get("/api/end-of-day", async (req, res) => {
    try {
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      // Get today's sales
      const allSales = await storage.getSales();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysSales = allSales.filter((sale) => {
        const saleDate = new Date(sale.soldAt);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime();
      });

      // Get current inventory
      const inventory = await storage.getProducts();

      // Prepare data for AI analysis
      const salesSummary = todaysSales.map(sale => {
        const product = inventory.find(p => p.id === Number(sale.productId));
        return {
          productName: product?.name || "Unknown",
          quantitySold: Number(sale.quantity),
          totalPrice: Number(sale.totalPrice),
        };
      });

      const inventorySummary = inventory.map(p => ({
        name: p.name,
        quantityRemaining: Number(p.quantity),
        minStock: Number(p.minStock),
        isLowStock: Number(p.quantity) <= Number(p.minStock),
      }));

      const prompt = `Eres un analista de negocios para una carnicería. Analiza los siguientes datos de ventas e inventario del día y proporciona un informe estructurado en JSON.

VENTAS DE HOY:
${JSON.stringify(salesSummary, null, 2)}

INVENTARIO ACTUAL:
${JSON.stringify(inventorySummary, null, 2)}

Por favor, proporciona un análisis en JSON con la siguiente estructura:
{
  "mostSoldProduct": "nombre del producto más vendido",
  "totalSalesValue": número,
  "criticalStockAlerts": ["producto1", "producto2"],
  "performanceAnalysis": "análisis detallado del desempeño del día",
  "strategicRecommendations": "recomendaciones para mañana"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 1000,
      });

      const analysisText = response.choices[0]?.message?.content || "{}";
      const analysis = JSON.parse(analysisText);

      // Generate Excel file
      const workbook = new ExcelJS.Workbook();

      // Summary sheet
      const summarySheet = workbook.addWorksheet("Resumen");
      summarySheet.columns = [
        { header: "Métrica", key: "metric", width: 40 },
        { header: "Valor", key: "value", width: 50 },
      ];

      summarySheet.addRow({
        metric: "Producto Más Vendido",
        value: analysis.mostSoldProduct || "N/A",
      });
      summarySheet.addRow({
        metric: "Valor Total de Ventas",
        value: `$${analysis.totalSalesValue || 0}`,
      });
      summarySheet.addRow({
        metric: "Alertas de Stock Crítico",
        value: (analysis.criticalStockAlerts || []).join(", ") || "Ninguna",
      });
      summarySheet.addRow({
        metric: "Análisis de Desempeño",
        value: analysis.performanceAnalysis || "N/A",
      });
      summarySheet.addRow({
        metric: "Recomendaciones Estratégicas",
        value: analysis.strategicRecommendations || "N/A",
      });

      // Sales sheet
      const salesSheet = workbook.addWorksheet("Ventas");
      salesSheet.columns = [
        { header: "Producto", key: "product", width: 25 },
        { header: "Cantidad Vendida (kg)", key: "quantity", width: 20 },
        { header: "Precio Total", key: "price", width: 20 },
      ];

      todaysSales.forEach((sale) => {
        const product = inventory.find(p => p.id === Number(sale.productId));
        salesSheet.addRow({
          product: product?.name || "Unknown",
          quantity: Number(sale.quantity),
          price: `$${Number(sale.totalPrice)}`,
        });
      });

      // Inventory sheet
      const inventorySheet = workbook.addWorksheet("Inventario");
      inventorySheet.columns = [
        { header: "Producto", key: "name", width: 25 },
        { header: "Stock Actual (kg)", key: "quantity", width: 20 },
        { header: "Stock Mínimo", key: "minStock", width: 20 },
        { header: "Estado", key: "status", width: 15 },
      ];

      inventory.forEach((product) => {
        const quantity = Number(product.quantity);
        const minStock = Number(product.minStock);
        inventorySheet.addRow({
          name: product.name,
          quantity: quantity,
          minStock: minStock,
          status: quantity <= minStock ? "BAJO" : "OK",
        });
      });

      // Return Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="cierre-diario-${new Date().toISOString().split('T')[0]}.xlsx"`
      );
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    } catch (error) {
      console.error("Error generating end-of-day report:", error);
      res.status(500).json({ message: "Error generating report" });
    }
  });

  // === Get End of Day Analysis (JSON only) ===
  app.get("/api/end-of-day-analysis", async (req, res) => {
    try {
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const allSales = await storage.getSales();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysSales = allSales.filter((sale) => {
        const saleDate = new Date(sale.soldAt);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime();
      });

      const inventory = await storage.getProducts();

      const salesSummary = todaysSales.map(sale => {
        const product = inventory.find(p => p.id === Number(sale.productId));
        return {
          productName: product?.name || "Unknown",
          quantitySold: Number(sale.quantity),
          totalPrice: Number(sale.totalPrice),
        };
      });

      const inventorySummary = inventory.map(p => ({
        name: p.name,
        quantityRemaining: Number(p.quantity),
        minStock: Number(p.minStock),
        isLowStock: Number(p.quantity) <= Number(p.minStock),
      }));

      const prompt = `Eres un analista de negocios para una carnicería. Analiza los siguientes datos de ventas e inventario del día y proporciona un informe estructurado en JSON.

VENTAS DE HOY:
${JSON.stringify(salesSummary, null, 2)}

INVENTARIO ACTUAL:
${JSON.stringify(inventorySummary, null, 2)}

Por favor, proporciona un análisis en JSON con la siguiente estructura:
{
  "mostSoldProduct": "nombre del producto más vendido",
  "totalSalesValue": número,
  "criticalStockAlerts": ["producto1", "producto2"],
  "performanceAnalysis": "análisis detallado del desempeño del día",
  "strategicRecommendations": "recomendaciones para mañana"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 1000,
      });

      const analysisText = response.choices[0]?.message?.content || "{}";
      const analysis = JSON.parse(analysisText);

      res.json({
        todaysSalesCount: todaysSales.length,
        totalSalesValue: salesSummary.reduce((sum, s) => sum + s.totalPrice, 0),
        analysis,
      });
    } catch (error) {
      console.error("Error generating analysis:", error);
      res.status(500).json({ message: "Error generating analysis" });
    }
  });

  return httpServer;
}

// Seed function to add some initial data
async function seedDatabase() {
  try {
    const existingProducts = await storage.getProducts();
    if (existingProducts.length === 0) {
      console.log("Seeding database...");
      
      // Add beef cuts
      await storage.createProduct({
        name: "Bife de Chorizo",
        description: "Corte premium, tierno y jugoso",
        unit: "kg",
        quantity: "25.5",
        costPrice: "8500",
        salePrice: "12500",
        minStock: "10"
      });

      await storage.createProduct({
        name: "Costillar",
        description: "Ideal para asado",
        unit: "kg",
        quantity: "50",
        costPrice: "6000",
        salePrice: "8900",
        minStock: "15"
      });

      // Add pork
      await storage.createProduct({
        name: "Bondiola",
        description: "Cerdo fresco",
        unit: "kg",
        quantity: "15",
        costPrice: "7000",
        salePrice: "10500",
        minStock: "5"
      });

      // Add sausages
      await storage.createProduct({
        name: "Chorizo Puro Cerdo",
        description: "Elaboración propia",
        unit: "kg",
        quantity: "30",
        costPrice: "4500",
        salePrice: "7000",
        minStock: "8"
      });

      console.log("Seeding complete!");
    }
  } catch (error) {
    console.log("Seeding will run after tables are created:", error instanceof Error ? error.message : error);
  }
}

// Execute seeding after a short delay to ensure DB is ready
setTimeout(seedDatabase, 2000);

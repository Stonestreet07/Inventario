import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Download, Loader2 } from "lucide-react";

interface Analysis {
  mostSoldProduct?: string;
  totalSalesValue?: number;
  criticalStockAlerts?: string[];
  performanceAnalysis?: string;
  strategicRecommendations?: string;
}

interface ReportData {
  todaysSalesCount: number;
  totalSalesValue: number;
  analysis: Analysis;
}

export default function EndOfDayReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // First fetch the analysis
      const analysisResponse = await fetch("/api/end-of-day-analysis");
      if (!analysisResponse.ok) {
        throw new Error("Failed to generate analysis");
      }
      const data: ReportData = await analysisResponse.json();
      setReportData(data);

      // Then download the Excel file
      const excelResponse = await fetch("/api/end-of-day");
      if (!excelResponse.ok) {
        throw new Error("Failed to generate Excel file");
      }

      const blob = await excelResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cierre-diario-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Reporte generado",
        description: "El análisis se muestra abajo y el archivo Excel se descargó correctamente.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Cierre del Día</h1>
          <p className="text-muted-foreground">
            Genera un análisis de desempeño con IA e importa a Excel
          </p>
        </div>

        <Button
          onClick={handleGenerateReport}
          disabled={loading}
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          data-testid="button-generate-report"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando Reporte...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generar y Descargar Reporte de Cierre
            </>
          )}
        </Button>

        {reportData && (
          <div className="space-y-6">
            <Card className="bg-card border p-6">
              <h2 className="text-xl font-bold mb-4">Resumen de Ventas</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transacciones Hoy</p>
                  <p className="text-2xl font-bold">{reportData.todaysSalesCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">${reportData.totalSalesValue.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-card border p-6">
              <h2 className="text-xl font-bold mb-4">Análisis de IA</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-base">Producto Más Vendido</h3>
                  <p className="text-muted-foreground mt-1">
                    {reportData.analysis.mostSoldProduct || "Sin datos"}
                  </p>
                </div>

                {reportData.analysis.criticalStockAlerts && 
                 reportData.analysis.criticalStockAlerts.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-900 dark:text-red-200">
                          Alertas de Stock Crítico
                        </h3>
                        <ul className="list-disc list-inside text-red-800 dark:text-red-300 mt-2 space-y-1">
                          {reportData.analysis.criticalStockAlerts.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-base mb-2">Análisis de Desempeño</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {reportData.analysis.performanceAnalysis || "Sin análisis"}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-2">Recomendaciones para Mañana</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {reportData.analysis.strategicRecommendations || "Sin recomendaciones"}
                  </p>
                </div>
              </div>
            </Card>

            <div className="text-xs text-muted-foreground text-center pt-4">
              El archivo Excel contiene tres pestañas: Resumen, Ventas e Inventario
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

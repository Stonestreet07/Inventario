import { PageLayout } from "@/components/layout/PageLayout";
import { useProducts } from "@/hooks/use-products";
import { useSales } from "@/hooks/use-sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, DollarSign, Package, FileText } from "lucide-react";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from "date-fns";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: sales, isLoading: loadingSales } = useSales();

  const stats = useMemo(() => {
    if (!products || !sales) return null;

    const totalProducts = products.length;
    const lowStockItems = products.filter(p => Number(p.quantity) <= Number(p.minStock)).length;
    
    // Calculate today's sales
    const today = new Date().toDateString();
    const todaysSales = sales.filter(s => s.soldAt && new Date(s.soldAt).toDateString() === today);
    const todaysRevenue = todaysSales.reduce((sum, s) => sum + Number(s.totalPrice), 0);
    
    // Calculate total revenue
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalPrice), 0);

    return { totalProducts, lowStockItems, todaysRevenue, totalRevenue };
  }, [products, sales]);

  const salesData = useMemo(() => {
    if (!sales) return [];
    
    // Group sales by product
    const productSales: Record<string, number> = {};
    sales.forEach(sale => {
      if (sale.product) {
        productSales[sale.product.name] = (productSales[sale.product.name] || 0) + Number(sale.totalPrice);
      }
    });

    return Object.entries(productSales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 products
  }, [sales]);

  if (loadingProducts || loadingSales) {
    return (
      <PageLayout title="Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Dashboard" description="Overview of your inventory and performance.">
      
      {/* End of Day Report Button */}
      <div className="mb-6">
        <Button
          onClick={() => setLocation("/end-of-day")}
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all"
          data-testid="button-end-of-day-nav"
        >
          <FileText className="mr-2 h-5 w-5" />
          Generar Reporte de Cierre del Día
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Products" 
          value={stats?.totalProducts || 0} 
          icon={Package} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={stats?.lowStockItems || 0} 
          icon={AlertTriangle} 
          color="bg-orange-500"
          highlight={stats?.lowStockItems ? stats.lowStockItems > 0 : false}
        />
        <StatCard 
          title="Today's Revenue" 
          value={`$${stats?.todaysRevenue.toFixed(2)}`} 
          icon={Activity} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${stats?.totalRevenue.toFixed(2)}`} 
          icon={DollarSign} 
          color="bg-primary" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
        {/* Sales Chart */}
        <Card className="rounded-2xl shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {salesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(354, 70%, ${45 + (index * 5)}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No sales data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="rounded-2xl shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-xl">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sales?.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{sale.product?.name || "Unknown Product"}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.soldAt && format(new Date(sale.soldAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+${Number(sale.totalPrice).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{sale.quantity} {sale.product?.unit}</p>
                  </div>
                </div>
              ))}
              {!sales?.length && (
                <div className="text-center py-8 text-muted-foreground">No recent transactions</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

function StatCard({ title, value, icon: Icon, color, highlight = false }: any) {
  return (
    <Card className={cn(
      "border-none shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 rounded-2xl overflow-hidden",
      highlight && "ring-2 ring-red-500 ring-offset-2"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-2 text-foreground font-display">{value}</h3>
          </div>
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg", color)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useProducts } from "@/hooks/use-products";
import { useCreateSale, useSales } from "@/hooks/use-sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2, Plus, ShoppingCart } from "lucide-react";

export default function Sales() {
  const { data: products } = useProducts();
  const { data: sales, isLoading: loadingSales } = useSales();
  const createSale = useCreateSale();

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [manualPrice, setManualPrice] = useState<string>("");

  const selectedProduct = useMemo(() => 
    products?.find(p => p.id.toString() === selectedProductId), 
    [products, selectedProductId]
  );

  const calculatedTotal = useMemo(() => {
    if (manualPrice) return manualPrice;
    if (!selectedProduct || !quantity) return "0.00";
    return (Number(selectedProduct.salePrice) * Number(quantity)).toFixed(2);
  }, [selectedProduct, quantity, manualPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    await createSale.mutateAsync({
      productId: Number(selectedProductId),
      quantity: quantity,
      totalPrice: calculatedTotal,
    });

    // Reset form
    setSelectedProductId("");
    setQuantity("1");
    setManualPrice("");
  };

  return (
    <PageLayout title="Point of Sale" description="Process transactions and view history.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sales Form */}
        <div className="lg:col-span-1">
          <Card className="rounded-2xl shadow-lg border-border/60 sticky top-8">
            <CardHeader className="bg-muted/20 pb-4">
              <CardTitle className="font-display flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                New Sale
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Product</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="rounded-xl h-12 bg-background">
                      <SelectValue placeholder="Search or select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.filter(p => p.isActive).map(product => (
                        <SelectItem key={product.id} value={product.id.toString()} disabled={Number(product.quantity) <= 0}>
                          {product.name} ({product.quantity} {product.unit} left)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity ({selectedProduct?.unit || 'units'})</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="rounded-xl h-12 text-center text-lg font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price</Label>
                    <Input 
                      disabled 
                      value={`$${selectedProduct ? Number(selectedProduct.salePrice).toFixed(2) : '0.00'}`}
                      className="rounded-xl h-12 text-center bg-muted/20"
                    />
                  </div>
                </div>

                <div className="space-y-2 p-4 bg-muted/30 rounded-xl border border-dashed border-border">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Total Price</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">$</span>
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder={calculatedTotal}
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      className="text-3xl font-bold bg-transparent border-none shadow-none p-0 h-auto focus-visible:ring-0 placeholder:text-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Default calculated. Type to override.</p>
                </div>

                <Button 
                  type="submit" 
                  disabled={!selectedProductId || createSale.isPending}
                  className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  {createSale.isPending ? <Loader2 className="animate-spin" /> : "Complete Sale"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sales History */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl shadow-sm border-border/60 min-h-[500px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Recent Transactions</CardTitle>
              {sales && <span className="text-sm text-muted-foreground">{sales.length} records</span>}
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingSales ? (
                      [1, 2, 3].map(i => (
                        <TableRow key={i}>
                          <TableCell colSpan={4}><div className="h-8 bg-muted/20 animate-pulse rounded" /></TableCell>
                        </TableRow>
                      ))
                    ) : sales?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                          No sales recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales?.map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-muted/20">
                          <TableCell className="text-muted-foreground">
                            {sale.soldAt && format(new Date(sale.soldAt), "MMM d, h:mm a")}
                          </TableCell>
                          <TableCell className="font-medium">{sale.product?.name}</TableCell>
                          <TableCell>{sale.quantity} {sale.product?.unit}</TableCell>
                          <TableCell className="text-right font-bold text-green-700">
                            ${Number(sale.totalPrice).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/use-products";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductForm } from "@/components/products/ProductForm";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Product } from "@shared/schema";

export default function Inventory() {
  const { data: products, isLoading } = useProducts();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (data: any) => {
    await createMutation.mutateAsync(data);
    setIsCreateOpen(false);
  };

  const handleUpdate = async (data: any) => {
    if (!editingProduct) return;
    await updateMutation.mutateAsync({ id: editingProduct.id, ...data });
    setEditingProduct(null);
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <PageLayout 
      title="Inventory" 
      description="Manage your product catalog, stock levels, and pricing."
      action={
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Add New Product</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new item to your inventory.
              </DialogDescription>
            </DialogHeader>
            <ProductForm onSubmit={handleCreate} isSubmitting={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      }
    >
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[300px]">Product Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>Sale Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-32 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-12 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-8 w-8 ml-auto bg-gray-100 rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : filteredProducts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No products found. Add one to get started!
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts?.map((product) => {
                  const isLowStock = Number(product.quantity) <= Number(product.minStock);
                  
                  return (
                    <TableRow key={product.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium font-display text-lg">
                        {product.name}
                        {isLowStock && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 font-sans font-medium mt-1">
                            <AlertCircle className="w-3 h-3" /> Low Stock
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? "default" : "secondary"} className={
                          product.isActive ? "bg-green-100 text-green-700 hover:bg-green-200 shadow-none border border-green-200" : ""
                        }>
                          {product.isActive ? "Active" : "Archived"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={isLowStock ? "text-orange-600 font-bold" : ""}>
                          {product.quantity} <span className="text-muted-foreground text-xs">{product.unit}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">${Number(product.costPrice).toFixed(2)}</TableCell>
                      <TableCell className="font-medium">${Number(product.salePrice).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Dialog open={!!editingProduct && editingProduct.id === product.id} onOpenChange={(open) => !open && setEditingProduct(null)}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setEditingProduct(product)}
                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] rounded-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Product</DialogTitle>
                              </DialogHeader>
                              <ProductForm 
                                defaultValues={{
                                  ...product,
                                  quantity: String(product.quantity),
                                  costPrice: String(product.costPrice),
                                  salePrice: String(product.salePrice),
                                  minStock: String(product.minStock),
                                }}
                                onSubmit={handleUpdate} 
                                isSubmitting={updateMutation.isPending}
                                submitLabel="Update Product"
                              />
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete <strong>{product.name}</strong> from your inventory.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(product.id)}
                                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageLayout>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertSale } from "@shared/schema";

export function useSales() {
  return useQuery({
    queryKey: [api.sales.list.path],
    queryFn: async () => {
      const res = await fetch(api.sales.list.path);
      if (!res.ok) throw new Error("Failed to fetch sales");
      return api.sales.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertSale) => {
      const res = await fetch(api.sales.create.path, {
        method: api.sales.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to register sale");
      }
      return api.sales.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate both sales list and products (since stock changed)
      queryClient.invalidateQueries({ queryKey: [api.sales.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      
      toast({
        title: "Sale Registered",
        description: "Transaction completed successfully.",
        className: "bg-green-600 text-white border-none",
      });
    },
    onError: (error) => {
      toast({
        title: "Sale Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

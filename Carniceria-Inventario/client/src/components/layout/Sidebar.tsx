import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingCart, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Sales", href: "/sales", icon: ShoppingCart },
];

export function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const NavLink = ({ item, mobile = false }: { item: typeof NAV_ITEMS[0], mobile?: boolean }) => {
    const isActive = location === item.href;
    return (
      <Link href={item.href} className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group font-medium",
        isActive 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        mobile && "text-lg"
      )}
      onClick={() => setIsOpen(false)}
      >
        <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-md bg-white shadow-md border"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      <div className={cn(
        "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity lg:hidden",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsOpen(false)} />

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border transition-transform duration-300 ease-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">C</span>
              Carnicería
            </h1>
            <p className="text-xs text-muted-foreground mt-1 ml-10 uppercase tracking-widest font-semibold">Manager</p>
          </div>

          <nav className="space-y-2 flex-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          <div className="pt-6 border-t border-border mt-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 border border-border flex items-center justify-center font-bold text-secondary">
                CM
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">Admin User</p>
                <p className="text-xs text-muted-foreground truncate">Manager Role</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

import { Sidebar } from "./Sidebar";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function PageLayout({ children, title, description, action }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen p-4 md:p-8 pt-16 lg:pt-8 transition-all">
        <div className="max-w-7xl mx-auto space-y-8">
          {(title || action) && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                {title && <h1 className="text-3xl font-display font-bold text-gray-900">{title}</h1>}
                {description && <p className="text-muted-foreground mt-1">{description}</p>}
              </div>
              {action && <div>{action}</div>}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

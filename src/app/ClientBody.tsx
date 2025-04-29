"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/auth-context";
import { TaskProvider } from "@/context/task-context";

// 创建QueryClient实例
const queryClient = new QueryClient();

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TaskProvider>
          <div className="antialiased min-h-screen bg-background">
            {children}
            <Toaster position="top-right" richColors />
          </div>
        </TaskProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

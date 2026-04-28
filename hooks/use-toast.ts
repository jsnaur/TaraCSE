"use client";

export function useToast() {
  return {
    toast: ({ 
      title, 
      description,
      variant 
    }: { 
      title: string; 
      description?: string;
      variant?: "default" | "destructive" | string;
    }) => {
      if (typeof window !== "undefined") {
        // You can expand this later when you implement actual visual toasts
        console.info(`Toast [${variant || 'default'}]:`, title, description ?? "");
      }
    },
  };
}
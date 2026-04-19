"use client";

export function useToast() {
  return {
    toast: ({ title, description }: { title: string; description?: string }) => {
      if (typeof window !== "undefined") {
        console.info("Toast:", title, description ?? "");
      }
    },
  };
}

import type { Metadata } from "next";
import { inter, spaceGrotesk } from "@/lib/fonts";
import "./globals.css";
import "katex/dist/katex.min.css"; // <-- ADD THIS LINE
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "TaraCSE - Civil Service Review",
  description: "Gamified Civil Service Exam review application for the Philippines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // Default to light, suppressHydrationWarning is mandatory for next-themes
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased light`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  ); 
}
import type { Metadata } from "next";
import { inter, spaceGrotesk } from "@/lib/fonts";
import "./globals.css";
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
      // Default to dark, suppressHydrationWarning is mandatory for next-themes
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  ); 
}
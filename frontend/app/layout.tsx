import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TeamUSA Gemini Analyst — Find Yourself in 120 Years of Team USA",
  description:
    "A Gemini-powered AI agent that matches your body profile to 120 years of Olympic and Paralympic Team USA athletes. Powered by Google Cloud.",
  keywords: ["Team USA", "Olympics", "Paralympics", "Gemini AI", "Google Cloud", "LA28", "athlete"],
  openGraph: {
    title: "TeamUSA Gemini Analyst",
    description: "Discover your athletic DNA across 120 years of Team USA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {/* Google Analytics GA4 */}
        <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-VNRE5VP9V0" />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-VNRE5VP9V0');
            `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="absolute top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

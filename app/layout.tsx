import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import AppNav from "@/components/AppNav";
import Footer from "@/components/Footer";
import ServiceWorker from "@/components/ServiceWorker";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RU Open",
  description:
    "Find free classrooms and study spaces across Rutgers University-New Brunswick",
  appleWebApp: { capable: true, title: "RU Open", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Apply the saved or system theme before first paint to avoid a flash.
const themeScript = `(function(){try{var s=localStorage.getItem("theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <div className="flex min-h-dvh flex-col pb-[calc(env(safe-area-inset-bottom)+3.5rem)] sm:pb-0">
          <AppNav />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 sm:px-6">
            {children}
          </main>
          <Footer />
        </div>
        <ServiceWorker />
      </body>
    </html>
  );
}

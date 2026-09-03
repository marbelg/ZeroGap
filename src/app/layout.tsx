import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { getDictionary } from "@/i18n/get-dictionary";
import { LocaleProvider } from "@/i18n/locale-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZeroGap — Control de Gastos",
  description:
    "Reporta y administra gastos de empleados: alimentación, kilometraje y aprobaciones.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZeroGap",
  },
};

export const viewport: Viewport = {
  themeColor: "#5b4cf0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const dict = await getDictionary();

  return (
    <html
      lang={dict.locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <LocaleProvider dict={dict}>
          {children}
          <ServiceWorkerRegister />
          <InstallPrompt />
        </LocaleProvider>
      </body>
    </html>
  );
}

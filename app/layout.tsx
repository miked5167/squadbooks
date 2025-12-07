import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
// import { Assistant } from "@/components/assistant/Assistant";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HuddleBooks - Team Financial Management",
  description: "Build trust with transparent financial safeguards and budget tracking for volunteer-run hockey teams",
  keywords: ["team finance", "budget tracking", "sports team", "hockey", "financial management", "expense tracking"],
  authors: [{ name: "HuddleBooks" }],
  openGraph: {
    title: "HuddleBooks - Team Financial Management",
    description: "Master your team's finances together with simple expense tracking and budget management",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en" className={ibmPlexSans.variable}>
        <body className={ibmPlexSans.className}>
          {children}
          <Toaster position="top-right" />
          {/* <Assistant /> */}
        </body>
      </html>
    </AuthProvider>
  );
}

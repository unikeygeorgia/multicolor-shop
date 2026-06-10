import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { StoreProvider } from "@/components/store-provider";
import { SiteChrome } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "მულტიკოლორი — სარემონტო მასალების ოფიციალური დისტრიბუტორი",
  description:
    "სარემონტო და სამშენებლო მასალების ოფიციალური დისტრიბუტორი საქართველოში — 8 იმპორტირებული ბრენდი, შერჩეული ასორტიმენტი.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka">
      <body>
        <AuthProvider>
          <StoreProvider>
            <SiteChrome>{children}</SiteChrome>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

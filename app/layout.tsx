import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Buy-Sale Products System",
  description: "ລະບົບຄຸ້ມຄອງຮ້ານໂທລະສັບ Multi-Branch ພ້ອມ IMEI Tracking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lo">
      <body>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}

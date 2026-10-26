import { SiteNav } from "@/components/layout/SiteNav";
import { Footer } from "@/components/layout/Footer";
import { RoleGate } from "@/components/layout/RoleGate";

export const metadata = { robots: { index: false, follow: false } };

export default function RenterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main id="main">
        <RoleGate role="renter">{children}</RoleGate>
      </main>
      <Footer />
    </>
  );
}

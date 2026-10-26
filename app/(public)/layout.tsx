import { SiteNav } from "@/components/layout/SiteNav";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}

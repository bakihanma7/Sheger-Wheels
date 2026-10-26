import { WorkspaceShell } from "@/components/layout/WorkspaceShell";

export const metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell variant="admin">{children}</WorkspaceShell>;
}

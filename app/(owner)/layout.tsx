import { WorkspaceShell } from "@/components/layout/WorkspaceShell";

export const metadata = { robots: { index: false, follow: false } };

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell variant="owner">{children}</WorkspaceShell>;
}

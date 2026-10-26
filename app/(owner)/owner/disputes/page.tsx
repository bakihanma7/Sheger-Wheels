import { DisputeList } from "@/components/owner/DisputeList";
import { PageHeader } from "@/components/ui/PageHeader";

export default function OwnerDisputesPage() {
  return (
    <div className="stack">
      <PageHeader title="Disputes" sub="Issues raised on rentals of your cars. Replying doesn't resolve them: an admin records the final resolution." />
      <DisputeList role="owner" />
    </div>
  );
}

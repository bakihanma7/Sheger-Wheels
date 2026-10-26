import { CarForm } from "@/components/owner/CarForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NewCarPage() {
  return (
    <div className="stack" style={{ maxWidth: 860 }}>
      <PageHeader title="Add a car" sub="Share your car on your schedule. You set the price and the availability." />
      <CarForm />
    </div>
  );
}

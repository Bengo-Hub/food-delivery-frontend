import { Input } from "@/components/ui/input";

interface DeliveryNotesSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function DeliveryNotesSection({ value, onChange }: DeliveryNotesSectionProps) {
  return (
    <section className="rounded-xl border border-border p-4">
      <label className="mb-2 block text-sm font-medium">Delivery Notes</label>
      <Input
        className="min-h-[44px]"
        placeholder="Gate code, landmarks, instructions..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  );
}

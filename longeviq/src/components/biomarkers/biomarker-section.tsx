import { Separator } from "@/components/ui/separator";
import { BiomarkerRow, type BiomarkerRowProps } from "./biomarker-row";

interface BiomarkerSectionProps {
  title: string;
  description?: string;
  markers: BiomarkerRowProps[];
}

export function BiomarkerSection({
  title,
  description,
  markers,
}: BiomarkerSectionProps) {
  return (
    <section>
      <div className="mb-5">
        <h3 className="text-fluid-lg font-medium text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-fluid-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-0">
        {markers.map((marker, i) => (
          <div key={marker.name}>
            <BiomarkerRow {...marker} />
            {i < markers.length - 1 && (
              <Separator className="ml-4 w-[calc(100%-1rem)]" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

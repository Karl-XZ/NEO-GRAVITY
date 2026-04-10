"use client";

import type { BodyComparisonRegion } from "@/types";

const REGION_LAYOUT: Record<
  BodyComparisonRegion["id"],
  {
    boxX: number;
    boxY: number;
    width: number;
    height: number;
    anchorX: number;
    anchorY: number;
    lineX: number;
    lineY: number;
  }
> = {
  brain: {
    boxX: 36,
    boxY: 132,
    width: 312,
    height: 204,
    anchorX: 472,
    anchorY: 228,
    lineX: 348,
    lineY: 220,
  },
  heart: {
    boxX: 612,
    boxY: 286,
    width: 312,
    height: 204,
    anchorX: 548,
    anchorY: 392,
    lineX: 612,
    lineY: 392,
  },
  metabolic: {
    boxX: 36,
    boxY: 432,
    width: 312,
    height: 204,
    anchorX: 450,
    anchorY: 560,
    lineX: 348,
    lineY: 548,
  },
  recovery: {
    boxX: 612,
    boxY: 624,
    width: 312,
    height: 204,
    anchorX: 540,
    anchorY: 746,
    lineX: 612,
    lineY: 742,
  },
  inflammation: {
    boxX: 612,
    boxY: 850,
    width: 312,
    height: 204,
    anchorX: 510,
    anchorY: 934,
    lineX: 612,
    lineY: 938,
  },
};

const TREND_COLOR = {
  improving: "#0F766E",
  stable: "#475569",
  declining: "#B91C1C",
} as const;

function RegionBox({ region }: { region: BodyComparisonRegion }) {
  const layout = REGION_LAYOUT[region.id];

  return (
    <g>
      <rect
        x={layout.boxX}
        y={layout.boxY}
        rx="28"
        ry="28"
        width={layout.width}
        height={layout.height}
        fill="#FFFFFF"
        stroke="#D7E4F1"
        strokeWidth="1.5"
      />

      <foreignObject
        x={layout.boxX + 20}
        y={layout.boxY + 18}
        width={layout.width - 40}
        height={layout.height - 36}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
            gap: "10px",
            fontFamily: "inherit",
            color: "#0F172A",
          }}
        >
          <div style={{ fontSize: "17px", fontWeight: 700, lineHeight: 1.15 }}>
            {region.label}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.3 }}>
            Current: {region.currentValue}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              paddingRight: "6px",
              scrollbarWidth: "thin",
              overflowWrap: "break-word",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: TREND_COLOR[region.adherenceTrend],
                fontWeight: 600,
                lineHeight: 1.34,
              }}
            >
              With adherence: {region.adherenceChange}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: TREND_COLOR[region.nonAdherenceTrend],
                fontWeight: 600,
                lineHeight: 1.34,
              }}
            >
              Without adherence: {region.nonAdherenceChange}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#94A3B8",
                lineHeight: 1.35,
              }}
            >
              {region.explanation}
            </div>
          </div>
        </div>
      </foreignObject>

      <line
        x1={layout.lineX}
        y1={layout.lineY}
        x2={layout.anchorX}
        y2={layout.anchorY}
        stroke="#94A3B8"
        strokeWidth="2"
        markerEnd="url(#body-arrow)"
      />
    </g>
  );
}

function BodyIllustration() {
  return (
    <g>
      <circle
        cx="480"
        cy="214"
        r="48"
        fill="#DDF5F2"
        stroke="#0D9488"
        strokeWidth="5"
      />

      <path
        d="M480 268V742"
        stroke="#0F172A"
        strokeWidth="12"
        strokeLinecap="round"
      />

      <path
        d="M480 360L378 478"
        stroke="#0F172A"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M480 360L582 478"
        stroke="#0F172A"
        strokeWidth="12"
        strokeLinecap="round"
      />

      <path
        d="M480 742L428 984"
        stroke="#0F172A"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M480 742L532 984"
        stroke="#0F172A"
        strokeWidth="12"
        strokeLinecap="round"
      />

      <ellipse
        cx="480"
        cy="412"
        rx="82"
        ry="126"
        fill="none"
        stroke="#0D9488"
        strokeOpacity="0.18"
        strokeWidth="3"
      />
      <ellipse
        cx="480"
        cy="566"
        rx="94"
        ry="90"
        fill="none"
        stroke="#6366F1"
        strokeOpacity="0.14"
        strokeWidth="3"
      />
      <ellipse
        cx="480"
        cy="744"
        rx="70"
        ry="92"
        fill="none"
        stroke="#F59E0B"
        strokeOpacity="0.1"
        strokeWidth="3"
      />
    </g>
  );
}

export function BodyComparisonMap({ regions }: { regions: BodyComparisonRegion[] }) {
  return (
    <div className="overflow-x-auto rounded-[28px] border border-[#E2E8F0] bg-[radial-gradient(circle_at_top,#f0fdfa_0%,#ffffff_58%)] p-5">
      <svg viewBox="0 0 960 1088" className="min-w-[960px]">
        <defs>
          <marker
            id="body-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#94A3B8" />
          </marker>
        </defs>

        <text
          x="480"
          y="60"
          textAnchor="middle"
          fill="#0F172A"
          fontSize="24"
          fontWeight="700"
        >
          Body Zone Comparison
        </text>
        <text
          x="480"
          y="92"
          textAnchor="middle"
          fill="#64748B"
          fontSize="13"
        >
          Arrows indicate the regions most likely to change under plan adherence or non-adherence.
        </text>

        <BodyIllustration />

        {regions.map((region) => (
          <RegionBox key={region.id} region={region} />
        ))}
      </svg>
    </div>
  );
}

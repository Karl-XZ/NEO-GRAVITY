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
    boxX: 32,
    boxY: 46,
    width: 280,
    height: 150,
    anchorX: 454,
    anchorY: 118,
    lineX: 312,
    lineY: 126,
  },
  heart: {
    boxX: 604,
    boxY: 158,
    width: 280,
    height: 150,
    anchorX: 492,
    anchorY: 236,
    lineX: 604,
    lineY: 236,
  },
  metabolic: {
    boxX: 32,
    boxY: 260,
    width: 280,
    height: 150,
    anchorX: 444,
    anchorY: 356,
    lineX: 312,
    lineY: 356,
  },
  recovery: {
    boxX: 604,
    boxY: 398,
    width: 280,
    height: 150,
    anchorX: 490,
    anchorY: 462,
    lineX: 604,
    lineY: 462,
  },
  inflammation: {
    boxX: 604,
    boxY: 564,
    width: 280,
    height: 150,
    anchorX: 472,
    anchorY: 610,
    lineX: 604,
    lineY: 610,
  },
};

const TREND_COLOR = {
  improving: "#0F766E",
  stable: "#475569",
  declining: "#B91C1C",
} as const;

function wrapText(text: string, maxChars: number) {
  const words = text.split(" ");
  const lines: string[] = [];

  for (const word of words) {
    const current = lines[lines.length - 1];
    if (!current) {
      lines.push(word);
      continue;
    }

    if (`${current} ${word}`.length <= maxChars) {
      lines[lines.length - 1] = `${current} ${word}`;
      continue;
    }

    lines.push(word);
  }

  return lines;
}

function RegionBox({ region }: { region: BodyComparisonRegion }) {
  const layout = REGION_LAYOUT[region.id];
  const explanationLines = wrapText(region.explanation, 40).slice(0, 3);

  return (
    <g>
      <rect
        x={layout.boxX}
        y={layout.boxY}
        rx="24"
        ry="24"
        width={layout.width}
        height={layout.height}
        fill="#FFFFFF"
        stroke="#DCE7F3"
      />

      <foreignObject
        x={layout.boxX + 20}
        y={layout.boxY + 18}
        width={layout.width - 40}
        height={layout.height - 32}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontFamily: "inherit",
            color: "#0F172A",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.2 }}>
            {region.label}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.3 }}>
            Aktuell: {region.currentValue}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: TREND_COLOR[region.adherenceTrend],
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            Bei Adhärenz: {region.adherenceChange}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: TREND_COLOR[region.nonAdherenceTrend],
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            Ohne Adhärenz: {region.nonAdherenceChange}
          </div>
          <div style={{ fontSize: "11px", color: "#94A3B8", lineHeight: 1.28 }}>
            {explanationLines.map((line) => (
              <div key={`${region.id}-${line}`}>{line}</div>
            ))}
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

export function BodyComparisonMap({ regions }: { regions: BodyComparisonRegion[] }) {
  return (
    <div className="overflow-x-auto rounded-[28px] border border-[#E2E8F0] bg-[radial-gradient(circle_at_top,#f0fdfa_0%,#ffffff_58%)] p-4">
      <svg viewBox="0 0 920 760" className="min-w-[920px]">
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

        <circle
          cx="460"
          cy="110"
          r="36"
          fill="#E2F7F4"
          stroke="#0D9488"
          strokeWidth="2.5"
        />
        <line
          x1="460"
          y1="146"
          x2="460"
          y2="420"
          stroke="#0F172A"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <line
          x1="460"
          y1="188"
          x2="382"
          y2="276"
          stroke="#0F172A"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <line
          x1="460"
          y1="188"
          x2="538"
          y2="276"
          stroke="#0F172A"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <line
          x1="460"
          y1="420"
          x2="402"
          y2="612"
          stroke="#0F172A"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <line
          x1="460"
          y1="420"
          x2="518"
          y2="612"
          stroke="#0F172A"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <ellipse
          cx="460"
          cy="236"
          rx="62"
          ry="86"
          fill="none"
          stroke="#0D9488"
          strokeOpacity="0.2"
          strokeWidth="2"
        />
        <ellipse
          cx="460"
          cy="336"
          rx="72"
          ry="72"
          fill="none"
          stroke="#6366F1"
          strokeOpacity="0.12"
          strokeWidth="2"
        />

        <text
          x="460"
          y="42"
          textAnchor="middle"
          fill="#0F172A"
          fontSize="20"
          fontWeight="700"
        >
          Körperzonen-Vergleich
        </text>
        <text
          x="460"
          y="64"
          textAnchor="middle"
          fill="#64748B"
          fontSize="12"
        >
          Pfeile markieren die Bereiche, die sich bei Adhärenz oder Nicht-Adhärenz am stärksten verändern.
        </text>

        {regions.map((region) => (
          <RegionBox key={region.id} region={region} />
        ))}
      </svg>
    </div>
  );
}

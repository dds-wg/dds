<script lang="ts">
  import { LayerCake, Svg } from "layercake";

  interface Row {
    statementUri: string;
    text: string;
    agree: number;
    disagree: number;
    pass: number;
    gic: number | null;
  }

  interface Props {
    rows: Row[];
  }

  let { rows }: Props = $props();

  const data = $derived(rows.slice(0, 30));
  const maxCount = $derived(Math.max(1, ...data.flatMap((r) => [r.agree, r.disagree, r.pass])));
  const padding = { top: 16, right: 24, bottom: 16, left: 24 };
</script>

<div class="w-full" style="height: {Math.max(160, data.length * 28)}px">
  <LayerCake
    data={data}
    x={(d: Row) => d.text}
    y={(_: Row, i: number) => i}
    {padding}
    xDomain={[-maxCount, maxCount]}
    yDomain={[0, Math.max(1, data.length)]}
  >
    <Svg>
      {#each data as r, i (r.statementUri)}
        {@const barH = 22}
        {@const yCenter = padding.top + i * 26 + barH / 2}
        <!-- disagree bar (left of center) -->
        <rect
          x={`${50 - (r.disagree / maxCount) * 48}%`}
          y={padding.top + i * 26}
          width={`${(r.disagree / maxCount) * 48}%`}
          height={barH}
          fill="var(--color-dds-disagree)"
          opacity="0.85"
        />
        <!-- agree bar (right of center) -->
        <rect
          x="50%"
          y={padding.top + i * 26}
          width={`${(r.agree / maxCount) * 48}%`}
          height={barH}
          fill="var(--color-dds-agree)"
          opacity="0.85"
        />
        <!-- center line -->
        <line x1="50%" y1={padding.top + i * 26} x2="50%" y2={padding.top + (i + 1) * 26 - 4} stroke="var(--color-dds-border)" />
        <text
          x="51%"
          y={yCenter + 5}
          fill="var(--color-dds-text)"
          font-size="11"
          font-family="var(--font-family-body)"
        >
          {r.text.length > 80 ? r.text.slice(0, 80) + "…" : r.text}
        </text>
        <text
          x="49%"
          y={yCenter + 5}
          text-anchor="end"
          fill="var(--color-dds-text-muted)"
          font-size="10"
          font-family="var(--font-family-mono)"
        >
          {r.disagree}
        </text>
      {/each}
    </Svg>
  </LayerCake>
</div>

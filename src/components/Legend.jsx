/**
 * Horizontal color legend for choropleth / heatmap (D3 scale).
 */

import { useEffect, useRef } from "react";
import * as d3 from "d3";

const LEGEND_TITLE_FILL = "#0f172a";
const LEGEND_TICK_FILL = "#1e293b";
const LEGEND_AXIS_STROKE = "#64748b";

export default function Legend({
  title,
  colorScale,
  width = 320,
  /** Title + gradient + axis ticks need more vertical space than the old 44px viewBox. */
  height = 116,
  format = (d) => String(d),
  /** Optional note below the axis (e.g. scale semantics). */
  footnote,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !colorScale) return;

    const svg = d3.select(el);
    svg.selectAll("*").remove();

    const margin = {
      top: 16,
      right: 14,
      bottom: footnote ? 44 : 28,
      left: 14,
    };
    const innerW = width - margin.left - margin.right;
    const maxCharsPerLine = Math.max(24, Math.floor(innerW / 6.2));
    const footnoteLines = footnote
      ? String(footnote)
          .split(/\s+/)
          .reduce((lines, word) => {
            const current = lines[lines.length - 1] ?? "";
            const next = current ? `${current} ${word}` : word;
            if (!current || next.length <= maxCharsPerLine) {
              lines[lines.length - 1] = next;
            } else {
              lines.push(word);
            }
            return lines;
          }, [""])
          .filter(Boolean)
      : [];
    const footnoteLineHeight = 14;
    const footnoteBlockHeight = footnoteLines.length * footnoteLineHeight;
    const svgHeight = footnote
      ? Math.max(height, 112 + footnoteBlockHeight)
      : height;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${svgHeight}`)
      .attr("width", "100%")
      .attr("height", svgHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const defs = svg.append("defs");
    const id = `lg-${Math.random().toString(36).slice(2)}`;
    const linear = defs
      .append("linearGradient")
      .attr("id", id)
      .attr("x1", "0%")
      .attr("x2", "100%");

    const domain = colorScale.domain();
    const [d0, d1] = d3.extent(domain);
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = d0 + (d1 - d0) * t;
      linear
        .append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", colorScale(x));
    }

    const titleBlock = 18;
    const barH = 14;

    g.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dominant-baseline", "hanging")
      .attr("fill", LEGEND_TITLE_FILL)
      .attr("font-size", 13)
      .attr("font-weight", 700)
      .text(title);

    g.append("rect")
      .attr("y", titleBlock)
      .attr("width", innerW)
      .attr("height", barH)
      .attr("fill", `url(#${id})`)
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 0.65);

    const axis = d3
      .axisBottom(d3.scaleLinear().domain([d0, d1]).range([0, innerW]))
      .ticks(4)
      .tickFormat((d) => format(d));

    g.append("g")
      .attr("transform", `translate(0,${titleBlock + barH})`)
      .call(axis)
      .call((ga) => ga.select(".domain").remove())
      .call((ga) =>
        ga.selectAll(".tick line").attr("stroke", LEGEND_AXIS_STROKE)
      )
      .call((ga) =>
        ga
          .selectAll("text")
          .attr("fill", LEGEND_TICK_FILL)
          .attr("font-weight", "500")
          .attr("font-size", 12)
      );

    if (footnoteLines.length) {
      const note = g.append("text")
        .attr("x", 0)
        .attr("y", titleBlock + barH + 28)
        .attr("fill", LEGEND_TICK_FILL)
        .attr("font-size", 11)
        .attr("font-weight", "500")
        .attr("dominant-baseline", "hanging");

      footnoteLines.forEach((line, i) => {
        note
          .append("tspan")
          .attr("x", 0)
          .attr("dy", i === 0 ? 0 : footnoteLineHeight)
          .text(line);
      });
    }
  }, [colorScale, width, height, title, format, footnote]);

  if (!colorScale) return null;

  return <svg ref={ref} className="legend-svg" aria-hidden />;
}

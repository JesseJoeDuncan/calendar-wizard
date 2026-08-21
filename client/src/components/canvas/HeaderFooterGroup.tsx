import { useState } from "react";
import { Group, Rect } from "react-konva";
import { CANVAS_W, HEADER_H, type CalendarGeometry } from "../../lib/calendarGeometry";
import { HEADER_FOOTER_ELEMENT_IDS, SEASON_TITLE_ANCHOR, getElementAnchor } from "../../lib/headerFooterLayout";
import type { CalendarHeaderFooter, SeasonTitleStyle } from "../../types/calendar";
import { CustomElementNode } from "./CustomElementNode";
import { HeaderFooterElementNode } from "./HeaderFooterElementNode";
import { SeasonTitleNode } from "./SeasonTitleNode";

interface Props {
  headerFooter: CalendarHeaderFooter;
  seasonTitle: SeasonTitleStyle;
  seasonLabel: string;
  year: string;
  geometry: CalendarGeometry;
  interactive: boolean;
  onOpen?: () => void;
}

/** Renders every header/footer decoration plus hoverable/clickable hit-regions over the header and footer bands, matching how movie cards highlight on hover. */
export function HeaderFooterGroup({ headerFooter, seasonTitle, seasonLabel, year, geometry, interactive, onOpen }: Props) {
  const [hoveredRegion, setHoveredRegion] = useState<"header" | "footer" | null>(null);

  // Footer shape first so the pill/text/logo elements composite on top of it; header/footer split
  // purely for readability, both render in the same group/z-order.
  const footerShapeIds = ["footerShape"] as const;
  const restIds = HEADER_FOOTER_ELEMENT_IDS.filter((id) => id !== "footerShape");

  function renderElement(id: (typeof HEADER_FOOTER_ELEMENT_IDS)[number]) {
    const style = headerFooter[id];
    if (!style.visible) return null;
    const anchor = getElementAnchor(id, headerFooter.footerShapeVariant);
    const w = anchor.w * style.scale;
    const h = anchor.h * style.scale;
    return (
      <HeaderFooterElementNode
        key={id}
        src={anchor.asset}
        x={anchor.x + style.offsetX}
        y={anchor.y + style.offsetY}
        width={w}
        height={h}
        color={style.color}
        scale={style.scale}
        echo={style.echo}
      />
    );
  }

  return (
    <>
      <Group
        onClick={interactive ? onOpen : undefined}
        onTap={interactive ? onOpen : undefined}
        onMouseEnter={interactive ? () => setHoveredRegion("header") : undefined}
        onMouseLeave={interactive ? () => setHoveredRegion(null) : undefined}
      >
        <Rect x={geometry.header.x} y={geometry.header.y} width={geometry.header.w} height={geometry.header.h} fill="#000000" opacity={0} listening={interactive} />
        {restIds.filter((id) => id === "sundayNightText" || id === "onyxLogo").map(renderElement)}
        <SeasonTitleNode x={SEASON_TITLE_ANCHOR.x} y={SEASON_TITLE_ANCHOR.y} seasonLabel={seasonLabel} year={year} style={seasonTitle} />
        {headerFooter.customElements.map((el) => (
          <CustomElementNode key={el.id} element={el} anchorX={CANVAS_W / 2} anchorY={HEADER_H / 2} />
        ))}
        {hoveredRegion === "header" && <Rect x={geometry.header.x} y={geometry.header.y} width={geometry.header.w} height={geometry.header.h} fill="#ffffff" opacity={0.12} listening={false} />}
      </Group>

      <Group
        onClick={interactive ? onOpen : undefined}
        onTap={interactive ? onOpen : undefined}
        onMouseEnter={interactive ? () => setHoveredRegion("footer") : undefined}
        onMouseLeave={interactive ? () => setHoveredRegion(null) : undefined}
      >
        <Rect x={geometry.footer.x} y={geometry.footer.y} width={geometry.footer.w} height={geometry.footer.h} fill="#000000" opacity={0} listening={interactive} />
        {footerShapeIds.map(renderElement)}
        {restIds.filter((id) => id !== "sundayNightText" && id !== "onyxLogo").map(renderElement)}
        {hoveredRegion === "footer" && <Rect x={geometry.footer.x} y={geometry.footer.y} width={geometry.footer.w} height={geometry.footer.h} fill="#ffffff" opacity={0.12} listening={false} />}
      </Group>
    </>
  );
}

import { Fragment } from "react";
import { CANVAS_W, type CalendarGeometry } from "../../lib/calendarGeometry";
import type { CalendarLayout } from "../../lib/layoutEngine";
import type { Calendar } from "../../types/calendar";
import { FillRect } from "./FillRect";
import { FooterNode } from "./FooterNode";
import { HeaderNode } from "./HeaderNode";
import { SeriesBandNode } from "./SeriesBandNode";
import { TitleBoxNode } from "./TitleBoxNode";

interface Props {
  calendar: Calendar;
  layout: CalendarLayout;
  geometry: CalendarGeometry;
  selectedTitleId: string | null;
  hoveredTitleId: string | null;
  interactive: boolean;
  onSelectTitle: (id: string) => void;
  onHoverTitle: (id: string | null) => void;
}

export function CalendarScene({ calendar, layout, geometry, selectedTitleId, hoveredTitleId, interactive, onSelectTitle, onHoverTitle }: Props) {
  const titleById = new Map(calendar.titles.map((t) => [t.id, t]));
  const seriesById = new Map(calendar.series.map((s) => [s.id, s]));

  return (
    <>
      {/* Header + body share one continuous background so boxes appear to float on a single poster, not a page. */}
      <FillRect fill={calendar.theme.headerBackground} x={0} y={0} w={CANVAS_W} h={geometry.footer.y} />
      <HeaderNode calendar={calendar} {...geometry.header} />

      {layout.rows.map((row, ri) => {
        const rowGeo = geometry.rows[ri];
        return (
          <Fragment key={ri}>
            {row.boxes.map((boxLayout, bi) => {
              const title = titleById.get(boxLayout.titleId);
              const boxGeo = rowGeo.boxes[bi];
              if (!title || !boxGeo) return null;
              return (
                <TitleBoxNode
                  key={title.id}
                  geometry={boxGeo}
                  boxLayout={boxLayout}
                  title={title}
                  selected={selectedTitleId === title.id}
                  hovered={hoveredTitleId === title.id}
                  interactive={interactive}
                  onSelect={() => onSelectTitle(title.id)}
                  onHover={(h) => onHoverTitle(h ? title.id : null)}
                />
              );
            })}
            {row.seriesBands.map((band, sbi) => {
              const series = seriesById.get(band.seriesId);
              const bandGeo = rowGeo.bands[sbi];
              if (!series || !bandGeo) return null;
              return <SeriesBandNode key={series.id} geometry={bandGeo} series={series} />;
            })}
          </Fragment>
        );
      })}

      <FooterNode calendar={calendar} {...geometry.footer} />
    </>
  );
}

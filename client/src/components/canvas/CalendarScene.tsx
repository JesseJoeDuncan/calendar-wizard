import { Fragment } from "react";
import { CANVAS_H, CANVAS_W, type CalendarGeometry } from "../../lib/calendarGeometry";
import type { CalendarLayout } from "../../lib/layoutEngine";
import type { Calendar } from "../../types/calendar";
import { FillRect } from "./FillRect";
import { HeaderFooterGroup } from "./HeaderFooterGroup";
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
  onImageOffsetChange?: (titleId: string, offsetX: number, offsetY: number) => void;
  /** Header/footer content always renders; this is only the click-to-open handler, absent for the export stage. */
  onOpenHeaderFooter?: () => void;
}

export function CalendarScene({
  calendar,
  layout,
  geometry,
  selectedTitleId,
  hoveredTitleId,
  interactive,
  onSelectTitle,
  onHoverTitle,
  onImageOffsetChange,
  onOpenHeaderFooter,
}: Props) {
  const titleById = new Map(calendar.titles.map((t) => [t.id, t]));
  const seriesById = new Map(calendar.series.map((s) => [s.id, s]));

  return (
    <>
      <FillRect fill={calendar.theme.background} x={0} y={0} w={CANVAS_W} h={CANVAS_H} />

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
                  rowHeight={rowGeo.height}
                  radii={calendar.theme.spacing}
                  selected={selectedTitleId === title.id}
                  hovered={hoveredTitleId === title.id}
                  interactive={interactive}
                  onSelect={() => onSelectTitle(title.id)}
                  onHover={(h) => onHoverTitle(h ? title.id : null)}
                  onImageOffsetChange={onImageOffsetChange}
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

      <HeaderFooterGroup headerFooter={calendar.theme.headerFooter} geometry={geometry} interactive={interactive} onOpen={onOpenHeaderFooter} />
    </>
  );
}

import { Shape, Text } from "react-konva";
import useImage from "use-image";
import { Image as KonvaImage } from "react-konva";
import type { Calendar } from "../../types/calendar";
import { FillRect } from "./FillRect";
import { KonvaImg } from "./KonvaImg";

interface Props {
  calendar: Calendar;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function FooterNode({ calendar, x, y, w, h }: Props) {
  const { venue, theme } = calendar;
  const fill = theme.footerBackground.value;
  const bumpD = 15;
  const count = Math.round(w / bumpD);
  const step = w / count;

  const [footerLogo] = useImage(venue.footerLogoUrl || "", "anonymous");
  const logoH = h * 0.5;
  const logoW = footerLogo ? (footerLogo.width / footerLogo.height) * logoH : logoH;
  const textLeft = x + 22 + (venue.footerLogoUrl ? logoW + 12 : 0);

  return (
    <>
      <FillRect fill={theme.footerBackground} x={x} y={y} w={w} h={h} />
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          for (let i = 0; i < count; i++) {
            const cx = x + step * i + step / 2;
            ctx.moveTo(cx - step / 2, y);
            ctx.arc(cx, y, step / 2, Math.PI, 0, false);
          }
          ctx.closePath();
          ctx.fillStrokeShape(shape);
        }}
        fill={fill}
      />

      {footerLogo && <KonvaImage image={footerLogo} x={x + 22} y={y + (h - logoH) / 2} width={logoW} height={logoH} />}

      <Text x={textLeft} y={y + h * 0.2} text={venue.venueName} fontFamily="Futura Wizard" fontStyle="bold" fontSize={h * 0.22} letterSpacing={0.5} fill="#eaf6f8" />
      <Text x={textLeft} y={y + h * 0.55} text={venue.address} fontFamily="Futura Wizard" fontSize={h * 0.14} fill="#dff1f3" opacity={0.9} />

      <Text
        x={x + w * 0.4}
        y={y + h * 0.22}
        width={w * 0.24}
        align="center"
        text={`DOORS at ${venue.doorsTime}`}
        fontFamily="Futura Wizard"
        fontStyle="bold"
        fontSize={h * 0.16}
        fill="#ffffff"
      />
      <Text
        x={x + w * 0.4}
        y={y + h * 0.42}
        width={w * 0.24}
        align="center"
        text={`SHOWS at ${venue.showTime}`}
        fontFamily="Futura Wizard"
        fontStyle="bold"
        fontSize={h * 0.16}
        fill="#ffffff"
      />
      <Text
        x={x + w * 0.4}
        y={y + h * 0.68}
        width={w * 0.24}
        align="center"
        text={venue.ageNote}
        fontFamily="Futura Wizard"
        fontStyle="bold"
        fontSize={h * 0.11}
        fill="#ffffff"
        opacity={0.85}
      />

      <Text
        x={x + w * 0.68}
        y={y + h * 0.2}
        text="TICKETS"
        fontFamily="Futura Wizard"
        fontStyle="bold"
        fontSize={h * 0.13}
        fill="#eaf6f8"
        letterSpacing={1}
      />
      <Text x={x + w * 0.68} y={y + h * 0.4} text={venue.ticketPrice} fontFamily="Futura Wizard Condensed" fontStyle="bold" fontSize={h * 0.32} fill="#ffffff" />
      <KonvaImg src={venue.qrCodeUrl} x={x + w - h * 0.9 - 18} y={y + h * 0.12} width={h * 0.78} height={h * 0.78} />
    </>
  );
}

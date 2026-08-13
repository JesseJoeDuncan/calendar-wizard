import type { Calendar } from "../../types/calendar";
import "./SettingsDrawer.css";

interface Props {
  calendar: Calendar;
  onChange: (patch: Partial<Calendar>) => void;
  onClose: () => void;
}

export function SettingsDrawer({ calendar, onChange, onClose }: Props) {
  const { venue, theme } = calendar;

  function updateVenue(patch: Partial<typeof venue>) {
    onChange({ venue: { ...venue, ...patch } });
  }

  function updateTheme(patch: Partial<typeof theme>) {
    onChange({ theme: { ...theme, ...patch } });
  }

  function updateSpacing(patch: Partial<typeof theme.spacing>) {
    onChange({ theme: { ...theme, spacing: { ...theme.spacing, ...patch } } });
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h3>Settings</h3>
          <button className="del-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-section">
          <h4>Header &amp; footer</h4>
          <label className="drawer-field">
            <span>Kicker text</span>
            <input value={venue.kicker} onChange={(e) => updateVenue({ kicker: e.target.value })} />
          </label>
          <label className="drawer-field">
            <span>Venue name</span>
            <input value={venue.venueName} onChange={(e) => updateVenue({ venueName: e.target.value })} />
          </label>
          <label className="drawer-field">
            <span>Address</span>
            <input value={venue.address} onChange={(e) => updateVenue({ address: e.target.value })} />
          </label>
          <label className="drawer-field">
            <span>Doors time</span>
            <input value={venue.doorsTime} onChange={(e) => updateVenue({ doorsTime: e.target.value })} />
          </label>
          <label className="drawer-field">
            <span>Show time</span>
            <input value={venue.showTime} onChange={(e) => updateVenue({ showTime: e.target.value })} />
          </label>
          <label className="drawer-field">
            <span>Ticket price</span>
            <input value={venue.ticketPrice} onChange={(e) => updateVenue({ ticketPrice: e.target.value })} />
          </label>
          <label className="drawer-field">
            <span>Age note</span>
            <input value={venue.ageNote} onChange={(e) => updateVenue({ ageNote: e.target.value })} />
          </label>
          <label className="drawer-field">
            <span>QR target URL</span>
            <input value={venue.qrTargetUrl} onChange={(e) => updateVenue({ qrTargetUrl: e.target.value })} />
          </label>
        </div>

        <div className="drawer-section">
          <h4>Colors</h4>
          <label className="drawer-field">
            <span>Header background</span>
            <input type="color" value={theme.headerBackground.value} onChange={(e) => updateTheme({ headerBackground: { type: "color", value: e.target.value } })} />
          </label>
          <label className="drawer-field">
            <span>Season/year text</span>
            <input type="color" value={theme.seasonTextColor} onChange={(e) => updateTheme({ seasonTextColor: e.target.value })} />
          </label>
          <label className="drawer-field">
            <span>Footer background</span>
            <input type="color" value={theme.footerBackground.value} onChange={(e) => updateTheme({ footerBackground: { type: "color", value: e.target.value } })} />
          </label>
        </div>

        <div className="drawer-section">
          <h4>Layout &amp; spacing</h4>
          <label className="drawer-field">
            <span>Outer margin</span>
            <input type="range" min={10} max={70} value={theme.spacing.outerMargin} onChange={(e) => updateSpacing({ outerMargin: Number(e.target.value) })} />
          </label>
          <label className="drawer-field">
            <span>Box gutter</span>
            <input type="range" min={0} max={20} value={theme.spacing.boxGutter} onChange={(e) => updateSpacing({ boxGutter: Number(e.target.value) })} />
          </label>
          <label className="drawer-field">
            <span>Row gap</span>
            <input type="range" min={0} max={30} value={theme.spacing.rowGap} onChange={(e) => updateSpacing({ rowGap: Number(e.target.value) })} />
          </label>
          <label className="drawer-field">
            <span>Band inset</span>
            <input type="range" min={0} max={40} value={theme.spacing.bandInset} onChange={(e) => updateSpacing({ bandInset: Number(e.target.value) })} />
          </label>
          <label className="drawer-field">
            <span>Band height</span>
            <input
              type="range"
              min={0.08}
              max={0.28}
              step={0.01}
              value={theme.spacing.bandHeightRatio}
              onChange={(e) => updateSpacing({ bandHeightRatio: Number(e.target.value) })}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

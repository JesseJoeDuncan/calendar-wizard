import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Icon } from "./Icon";
import "./SplashScreen.css";

const SPLASH_SHOWN_KEY = "calendarWizard.splashShown";

/** The app's landing pop-up, shown once per browser session before any calendar is opened. */
export function SplashScreen() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(SPLASH_SHOWN_KEY));
  const [mostRecentId, setMostRecentId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    api
      .listCalendars()
      .then((r) => setMostRecentId(r.calendars[0]?.id ?? null))
      .catch(() => {});
  }, [visible]);

  function dismiss() {
    sessionStorage.setItem(SPLASH_SHOWN_KEY, "1");
    setVisible(false);
  }

  function handleOpenExisting() {
    dismiss();
    if (mostRecentId) navigate(`/edit/${mostRecentId}`);
  }

  if (!visible) return null;

  return (
    <div className="splash-overlay">
      <div className="splash-panel">
        <div className="splash-titlebar" />
        <div className="splash-body">
          <img className="splash-logo" src="/assets/logos/CalWiz_LOGO.png" alt="Calendar Wizard" />
          <h1 className="splash-wordmark">Calendar Wizard</h1>
          <div className="splash-buttons">
            <button type="button" className="splash-btn" onClick={dismiss}>
              <Icon name="add_movie_card" size={22} />
              Create New Calendar
            </button>
            <button type="button" className="splash-btn" onClick={handleOpenExisting} disabled={!mostRecentId}>
              <Icon name="open_file" size={22} />
              Open Existing Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

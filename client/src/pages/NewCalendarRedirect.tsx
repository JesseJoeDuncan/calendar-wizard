import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { computeSmartStartDefaults } from "../lib/smartDefaults";

/** Creates a blank draft calendar and redirects to /new/:id, so the start page always has a real, switchable/deletable id to work with. */
export function NewCalendarRedirect() {
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const { season, year } = computeSmartStartDefaults(new Date());
    api
      .createCalendar(season, year)
      .then((created) => navigate(`/new/${created.id}`, { replace: true }))
      .catch((err) => console.error("Failed to create a new draft calendar", err));
  }, [navigate]);

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.95rem" }}>
      Setting up a new calendar…
    </div>
  );
}

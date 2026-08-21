import { Icon } from "./Icon";
import "./VisibilityToggle.css";

interface Props {
  visible: boolean;
  onChange: (visible: boolean) => void;
  title?: string;
}

/** An eye-icon toggle for show/hide settings — used wherever a checkbox would otherwise mean "is this element visible on the calendar." */
export function VisibilityToggle({ visible, onChange, title }: Props) {
  const label = title ?? (visible ? "Visible — click to hide" : "Hidden — click to show");
  return (
    <button type="button" className={`visibility-toggle${visible ? "" : " off"}`} onClick={() => onChange(!visible)} title={label}>
      <Icon name={visible ? "element_visible" : "element_not_visible"} title={label} />
    </button>
  );
}

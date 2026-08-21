import "./Icon.css";

export type IconName =
  | "add"
  | "add_image"
  | "add_minor"
  | "add_movie_card"
  | "add_special_element"
  | "add_tag"
  | "add_text_element"
  | "background_or_texture"
  | "bold"
  | "brightness"
  | "calendar"
  | "close_window"
  | "color"
  | "color_palette"
  | "colors_menu"
  | "contrast"
  | "corner_radius"
  | "crop"
  | "darkmode_lightmode"
  | "defaults_menu"
  | "delete"
  | "down"
  | "download_or_export"
  | "dropshadow"
  | "duplicate"
  | "edit"
  | "edit_filename"
  | "edit_image"
  | "edit_text"
  | "element_not_visible"
  | "element_visible"
  | "flip_horizontal"
  | "flip_vertical"
  | "font"
  | "grab_tool"
  | "gutter_spacing"
  | "header_footer_menu"
  | "horizontal_distance"
  | "image"
  | "italic"
  | "kerning"
  | "layout"
  | "left"
  | "line_spacing"
  | "locked"
  | "menu_generic"
  | "more_options"
  | "new_calendar"
  | "opacity"
  | "open_file"
  | "redo"
  | "remove_special_element"
  | "remove_tag"
  | "reset_all_to_default"
  | "reset_to_default"
  | "right"
  | "rotate_element"
  | "save"
  | "save_defaults"
  | "scale"
  | "select_tool"
  | "settings_menu"
  | "spacial_position"
  | "special_effect"
  | "special_element"
  | "tag"
  | "text_element"
  | "text_size"
  | "title_element"
  | "underline"
  | "undo"
  | "unlocked"
  | "up"
  | "upload_image"
  | "vertical_distance"
  | "warning"
  | "xray_mode"
  | "zoom_in"
  | "zoom_out";

interface Props {
  name: IconName;
  size?: number;
  title?: string;
  className?: string;
}

/** A single-color icon glyph, recolored via CSS mask so it always matches currentColor (theme, hover, disabled state) instead of being baked in as a fixed-color raster. */
export function Icon({ name, size = 16, title, className }: Props) {
  const url = `/assets/icons/${name}.png`;
  return (
    <span
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`icon${className ? ` ${className}` : ""}`}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
      }}
    />
  );
}

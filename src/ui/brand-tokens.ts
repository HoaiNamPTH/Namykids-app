/**
 * Brand colors sampled from the approved Step 8 / Option 02 primary logo.
 * Surface neutrals come from the approved 2026-09-24 Soft CGI concept image.
 */
export const namyColors = {
  brand: {
    primary: "#201080",
    secondary: "#00D0B0",
    accent: "#FFC000",
    info: "#00A0FF",
    highlight: "#FF4080",
  },
  surface: {
    base: "#E0F0FF",
    raised: "#FFFFFF",
    subtle: "#FFF6D9",
    calm: "#F0F0FF",
  },
  text: {
    primary: "#201080",
    secondary: "#201080B8",
    inverse: "#FFFFFF",
  },
  border: {
    default: "#20108033",
    strong: "#201080",
  },
  state: {
    correct: "#00D0B0",
    correctSurface: "#D9F8F3",
    retry: "#FFC000",
    retrySurface: "#FFF6D9",
    assisted: "#FF4080",
    restricted: "#20108099",
    pending: "#00A0FF",
    error: "#FF4080",
  },
  interaction: {
    focus: "#00A0FF",
    pressed: "#201080CC",
    selected: "#00A0FF",
    disabled: "#20108055",
  },
  overlay: {
    scrim: "#20108066",
  },
} as const;

export const namyBrandSource = {
  logo: "namykids_logo_primary_horizontal_no_tagline.png — Step 8 / Option 02",
  visual: "User-approved NamyKids Soft CGI concept image — 2026-09-24",
  typographyStatus: "System-safe fallback active; exact production UI font is PENDING USER APPROVAL",
} as const;

import cam from "../assets/play/colors/cam.png";
import den from "../assets/play/colors/den.png";
import doImg from "../assets/play/colors/do.png";
import hong from "../assets/play/colors/hong.png";
import nau from "../assets/play/colors/nau.png";
import tim from "../assets/play/colors/tim.png";
import trang from "../assets/play/colors/trang.png";
import vang from "../assets/play/colors/vang.png";
import xanhDuong from "../assets/play/colors/xanh-duong.png";
import xanhLa from "../assets/play/colors/xanh-la.png";

/**
 * The colours the Colour group teaches, as glossy beads. Each bead's middle tone is the colour's
 * reference value below, so the picture never drifts from the name the child hears.
 * Vietnamese "xanh" alone is ambiguous (green or blue), so the names always say "xanh lá" / "xanh dương".
 */
export const COLORS = {
  do: { name: "màu đỏ", hex: "#E53935", image: doImg },
  vang: { name: "màu vàng", hex: "#FDD835", image: vang },
  "xanh-la": { name: "màu xanh lá", hex: "#43A047", image: xanhLa },
  "xanh-duong": { name: "màu xanh dương", hex: "#1E88E5", image: xanhDuong },
  cam: { name: "màu cam", hex: "#FB8C00", image: cam },
  tim: { name: "màu tím", hex: "#8E24AA", image: tim },
  hong: { name: "màu hồng", hex: "#F48FB1", image: hong },
  nau: { name: "màu nâu", hex: "#795548", image: nau },
  trang: { name: "màu trắng", hex: "#FAFAFA", image: trang },
  den: { name: "màu đen", hex: "#212121", image: den },
} as const;

export type ColorId = keyof typeof COLORS;

/** Colours by level: Dễ = 4 basic colours, Vừa adds 3, Khó adds the last 3. */
export const COLOR_LEVELS: readonly (readonly ColorId[])[] = [
  ["do", "vang", "xanh-la", "xanh-duong"],
  ["do", "vang", "xanh-la", "xanh-duong", "cam", "tim", "hong"],
  ["do", "vang", "xanh-la", "xanh-duong", "cam", "tim", "hong", "nau", "trang", "den"],
];

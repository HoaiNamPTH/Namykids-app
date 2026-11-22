import language from "../assets/play/areas/language.png";
import life from "../assets/play/areas/life.png";
import math from "../assets/play/areas/math.png";
import senses from "../assets/play/areas/senses.png";
import world from "../assets/play/areas/world.png";

export type AreaId = "ngon-ngu" | "toan" | "giac-quan" | "ky-nang-song" | "kham-pha";

export type Area = {
  id: AreaId;
  name: string;
  hint: string;
  icon: typeof language;
  tint: string;
  open: boolean;
};

/** The five Montessori-based learning areas chosen by the Product Owner (22/11/2026). */
export const AREAS: readonly Area[] = [
  { id: "ngon-ngu", name: "Ngôn ngữ", hint: "Từ, âm, chữ cái", icon: language, tint: "#D6ECFE", open: true },
  { id: "toan", name: "Toán", hint: "Số, đếm, hình", icon: math, tint: "#DFFBE2", open: false },
  { id: "giac-quan", name: "Giác quan", hint: "Màu, âm thanh, kích thước", icon: senses, tint: "#FEF7DA", open: false },
  { id: "ky-nang-song", name: "Kỹ năng sống", hint: "Tự phục vụ, sinh hoạt", icon: life, tint: "#F1DDFD", open: false },
  { id: "kham-pha", name: "Khám phá thế giới", hint: "Con vật, cây cối, đồ vật", icon: world, tint: "#FEF2C4", open: false },
];

export function findArea(id: string | undefined): Area | undefined {
  return AREAS.find((area) => area.id === id);
}

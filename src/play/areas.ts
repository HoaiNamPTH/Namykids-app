import animals from "../assets/play/groups/animals.jpg";
import art from "../assets/play/groups/art.jpg";
import colors from "../assets/play/groups/colors.jpg";
import daily from "../assets/play/groups/daily.jpg";
import family from "../assets/play/groups/family.jpg";
import letters from "../assets/play/groups/letters.jpg";
import numbers from "../assets/play/groups/numbers.jpg";
import objects from "../assets/play/groups/objects.jpg";

/** The 8 learning groups of the approved Product Canon. */
export type AreaId = "chu-cai" | "so-hoc" | "mau-sac" | "con-vat" | "do-vat" | "gia-dinh" | "nghe-thuat" | "ky-nang";

export type Area = {
  id: AreaId;
  name: string;
  icon: typeof letters;
  tint: string;
  /** Pictures cropped from the approved 24/09 concept; the two marked false still use interim art. */
  conceptArt: boolean;
};

export const AREAS: readonly Area[] = [
  { id: "chu-cai", name: "Chữ cái & vần", icon: letters, tint: "#D6ECFE", conceptArt: true },
  { id: "so-hoc", name: "Số học & tư duy", icon: numbers, tint: "#DFFBE2", conceptArt: true },
  { id: "mau-sac", name: "Màu sắc", icon: colors, tint: "#FEF7DA", conceptArt: true },
  { id: "con-vat", name: "Con vật", icon: animals, tint: "#FEF2C4", conceptArt: true },
  { id: "do-vat", name: "Đồ vật quanh bé", icon: objects, tint: "#E4E9FB", conceptArt: true },
  { id: "gia-dinh", name: "Gia đình", icon: family, tint: "#F1DDFD", conceptArt: true },
  { id: "nghe-thuat", name: "Nghệ thuật & sáng tạo", icon: art, tint: "#FFE8D6", conceptArt: false },
  { id: "ky-nang", name: "Kỹ năng hằng ngày", icon: daily, tint: "#E1F0FF", conceptArt: false },
];

export function findArea(id: string | undefined): Area | undefined {
  return AREAS.find((area) => area.id === id);
}

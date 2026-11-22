import type { AreaId } from "./areas";
import type { ItemId } from "./items";

/** The six reusable play templates. A game is content data run by one template. */
export type TemplateId = "listen-choose" | "tap-select" | "match-pairs" | "drag-fill" | "sequence" | "flip-cards";

export const TEMPLATES: Record<TemplateId, { name: string; tint: string }> = {
  "listen-choose": { name: "Nghe và chọn", tint: "#DCEBFF" },
  "tap-select": { name: "Chạm chọn", tint: "#FFF1C9" },
  "match-pairs": { name: "Ghép đôi", tint: "#FDE3EF" },
  "drag-fill": { name: "Kéo thả điền thiếu", tint: "#E3F6E6" },
  sequence: { name: "Sắp xếp", tint: "#EFE6FF" },
  "flip-cards": { name: "Lật thẻ", tint: "#FFE7D6" },
};

export type GameIcon = { item: ItemId } | { glyph: string };

export type GameMeta = {
  id: string;
  no: number;
  area: AreaId;
  title: string;
  template: TemplateId;
  ages: string;
  icon: GameIcon;
  /** What the guide says when the game opens. Always spoken; the child never has to read. */
  intro: string;
  /** Milestone in which the game becomes playable. */
  milestone: 2 | 3;
};

const g = (no: number, id: string, title: string, template: TemplateId, ages: string, icon: GameIcon, intro: string, milestone: 2 | 3): GameMeta =>
  ({ id, no, area: "ngon-ngu", title, template, ages, icon, intro, milestone });

/** Language area list, as sent to the Product Owner on 22/11/2026 (Drive: 03_EDUCATION_CONTENT_VOICE). */
export const LANGUAGE_GAMES: readonly GameMeta[] = [
  g(1, "tim-do-vat", "Bé tìm đồ vật", "listen-choose", "2–4", { item: "apple" }, "Con nghe tên đồ vật, rồi chạm vào tranh đúng nhé.", 2),
  g(2, "ai-keu-the", "Ai kêu thế nhỉ?", "listen-choose", "2–4", { item: "cat" }, "Con nghe tiếng kêu, rồi chạm vào bạn kêu như thế nhé.", 2),
  g(3, "ban-giong-het", "Tìm bạn giống hệt", "match-pairs", "2–3", { item: "teddy" }, "Con chạm hai tranh giống hệt nhau nhé.", 2),
  g(4, "me-oi-con-dau", "Mẹ ơi, con đâu?", "match-pairs", "2–4", { item: "chick" }, "Con giúp mỗi bạn mẹ tìm em bé của mình nhé.", 2),
  g(5, "doi-ban-than", "Đôi bạn thân", "match-pairs", "3–5", { item: "key" }, "Con ghép hai đồ vật hay đi cùng nhau nhé.", 2),
  g(6, "be-gom-nhom", "Bé gom nhóm", "tap-select", "3–4", { item: "banana" }, "Con chạm vào tất cả các bạn cùng nhóm nhé.", 2),
  g(7, "khac-nhom", "Cái nào khác nhóm?", "tap-select", "3–5", { item: "car" }, "Có một bạn không cùng nhóm. Con tìm bạn ấy nhé.", 2),
  g(8, "de-lam-gi", "Cái gì để làm gì?", "listen-choose", "3–5", { item: "scissors" }, "Con nghe câu hỏi, rồi chạm vào đồ vật đúng nhé.", 3),
  g(9, "cam-xuc", "Bạn đang thấy thế nào?", "listen-choose", "3–5", { item: "happy" }, "Con nghe rồi chạm vào khuôn mặt đúng nhé.", 3),
  g(10, "tren-duoi-trong", "Trên, dưới, trong", "tap-select", "3–5", { item: "chair" }, "Con nghe rồi chạm vào tranh đúng chỗ nhé.", 3),
  g(11, "nguoc-nhau", "Ngược nhau", "match-pairs", "4–5", { item: "fire" }, "Con ghép hai tranh ngược nhau nhé.", 3),
  g(12, "chuyen-cay-con", "Chuyện cây con", "sequence", "3–5", { item: "seedling" }, "Con xếp tranh theo thứ tự cây lớn lên nhé.", 2),
  g(13, "mot-ngay-cua-be", "Một ngày của bé", "sequence", "4–5", { item: "alarm" }, "Con xếp các việc buổi sáng theo đúng thứ tự nhé.", 2),
  g(14, "be-rua-tay", "Bé rửa tay", "sequence", "3–5", { item: "soap" }, "Con xếp các bước rửa tay theo thứ tự nhé.", 3),
  g(15, "am-dau", "Âm đầu là gì?", "listen-choose", "4–5", { item: "ball" }, "Con nghe âm, rồi chạm vào tranh bắt đầu bằng âm đó nhé.", 2),
  g(16, "cung-am-dau", "Cùng âm đầu", "match-pairs", "4–6", { item: "crab" }, "Con ghép hai tranh có cùng âm đầu nhé.", 3),
  g(17, "van-voi-nhau", "Vần với nhau", "match-pairs", "5–6", { item: "leaf" }, "Con ghép hai tranh có tên vần với nhau nhé.", 3),
  g(18, "vo-tay-dem-tieng", "Vỗ tay đếm tiếng", "tap-select", "4–6", { item: "drum" }, "Con nghe rồi chọn số tiếng nhé.", 3),
  g(19, "nghe-chon-chu", "Nghe rồi chọn chữ", "listen-choose", "4–5", { glyph: "o" }, "Con nghe tên chữ, rồi chạm vào chữ đó nhé.", 2),
  g(20, "chu-va-tranh", "Chữ cái và tranh", "match-pairs", "4–6", { glyph: "b" }, "Con ghép chữ với tranh bắt đầu bằng chữ đó nhé.", 2),
  g(21, "chu-hoa-thuong", "Chữ hoa, chữ thường", "match-pairs", "5–6", { glyph: "Aa" }, "Con ghép chữ hoa với chữ thường của nó nhé.", 2),
  g(22, "chu-con-thieu", "Chữ nào còn thiếu?", "drag-fill", "4–6", { glyph: "A_C" }, "Chữ nào còn thiếu? Con kéo chữ vào ô trống nhé.", 2),
  g(23, "chu-dau-cua-tranh", "Chữ đầu của tranh", "drag-fill", "5–6", { item: "fish" }, "Con kéo chữ đầu vào ô trống trước tranh nhé.", 2),
  g(24, "xep-bang-chu", "Xếp bảng chữ cái", "sequence", "5–6", { glyph: "ABC" }, "Con xếp các chữ theo đúng thứ tự nhé.", 3),
  g(25, "lat-the-tim-cap", "Lật thẻ tìm cặp", "flip-cards", "3–6", { item: "star" }, "Con lật hai thẻ. Nếu giống nhau thì giữ lại nhé.", 3),
  g(26, "lat-the-chu-tranh", "Lật thẻ chữ và tranh", "flip-cards", "5–6", { glyph: "c" }, "Con lật tìm chữ và tranh đi cùng nhau nhé.", 3),
];

export function gamesForArea(area: AreaId): readonly GameMeta[] {
  return area === "ngon-ngu" ? LANGUAGE_GAMES : [];
}

export function findGame(id: string | undefined): GameMeta | undefined {
  return LANGUAGE_GAMES.find((game) => game.id === id);
}

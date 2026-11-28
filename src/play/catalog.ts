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
  /** Nam 25/11/2026: the few words shown on screen while the voice reads the full instruction. */
  short: string;
  /** Milestone in which the game becomes playable. */
  milestone: 2 | 3 | 4;
};

/** Proposal (25/11/2026): which of the 8 approved learning groups each existing game belongs to. */
const GROUP_OF: Record<string, AreaId> = {
  "nghe-chon-chu": "chu-cai", "chu-va-tranh": "chu-cai", "chu-hoa-thuong": "chu-cai", "chu-con-thieu": "chu-cai", "chu-dau-cua-tranh": "chu-cai",
  "xep-bang-chu": "chu-cai", "lat-the-chu-tranh": "chu-cai", "am-dau": "chu-cai", "cung-am-dau": "chu-cai", "van-voi-nhau": "chu-cai", "vo-tay-dem-tieng": "chu-cai",
  "ban-giong-het": "so-hoc", "be-gom-nhom": "so-hoc", "khac-nhom": "so-hoc", "tren-duoi-trong": "so-hoc", "nguoc-nhau": "so-hoc", "lat-the-tim-cap": "so-hoc", "chuyen-cay-con": "so-hoc",
  "ai-keu-the": "con-vat", "me-oi-con-dau": "con-vat",
  "tim-do-vat": "do-vat", "doi-ban-than": "do-vat", "de-lam-gi": "do-vat",
  "be-rua-tay": "ky-nang", "mot-ngay-cua-be": "ky-nang", "cam-xuc": "ky-nang",
};

/** Short on-screen line per Language game (the voice reads the full intro and prompts). */
const SHORT: Record<string, string> = {
  "tim-do-vat": "Tìm đồ vật", "ai-keu-the": "Ai kêu thế?", "ban-giong-het": "Ghép hai tranh giống hệt", "me-oi-con-dau": "Tìm em bé cho mẹ",
  "doi-ban-than": "Ghép đồ hay đi cùng nhau", "be-gom-nhom": "Tìm cùng nhóm", "khac-nhom": "Bạn nào khác nhóm?", "de-lam-gi": "Để làm gì?",
  "cam-xuc": "Bạn thấy thế nào?", "tren-duoi-trong": "Trên, dưới, trong", "nguoc-nhau": "Ghép tranh ngược nhau",
  "chuyen-cay-con": "Cây lớn lên", "mot-ngay-cua-be": "Việc nào trước?", "be-rua-tay": "Các bước rửa tay", "am-dau": "Âm đầu",
  "cung-am-dau": "Ghép tranh cùng âm đầu", "van-voi-nhau": "Ghép tranh vần với nhau", "vo-tay-dem-tieng": "Mấy tiếng?", "nghe-chon-chu": "Nghe và chọn chữ",
  "chu-va-tranh": "Ghép chữ với tranh", "chu-hoa-thuong": "Ghép chữ hoa với chữ thường", "chu-con-thieu": "Chữ nào còn thiếu?",
  "chu-dau-cua-tranh": "Chữ đầu của tranh", "xep-bang-chu": "Xếp chữ theo thứ tự", "lat-the-tim-cap": "Lật tìm hai tranh giống nhau", "lat-the-chu-tranh": "Lật tìm chữ và tranh",
};

const g = (no: number, id: string, title: string, template: TemplateId, ages: string, icon: GameIcon, intro: string, milestone: 2 | 3 | 4): GameMeta =>
  ({ id, no, area: GROUP_OF[id] ?? "chu-cai", title, template, ages, icon, intro, short: SHORT[id] ?? title, milestone });

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

const n = (no: number, id: string, area: AreaId, title: string, template: TemplateId, ages: string, icon: GameIcon, intro: string, short: string): GameMeta =>
  ({ id, no, area, title, template, ages, icon, intro, short, milestone: 4 });

/** Màu sắc, Gia đình, Nghệ thuật & sáng tạo (proposal 25/11/2026). Content: content/groups.ts. */
export const GROUP_GAMES: readonly GameMeta[] = [
  n(27, "cham-dung-mau", "mau-sac", "Chạm đúng màu", "listen-choose", "2–4", { item: "palette" }, "Con nghe tên màu, rồi chạm vào màu đó nhé.", "Chạm đúng màu"),
  n(28, "tim-do-cung-mau", "mau-sac", "Tìm đồ cùng màu", "tap-select", "3–5", { item: "strawberry" }, "Con chạm vào tất cả những thứ có cùng màu nhé.", "Tìm đồ cùng màu"),
  n(29, "mau-gi-day", "mau-sac", "Quả này màu gì?", "match-pairs", "3–5", { item: "banana" }, "Con ghép mỗi tranh với màu của nó nhé.", "Ghép tranh với màu"),
  n(30, "pha-mau", "mau-sac", "Pha màu", "drag-fill", "5–6", { item: "paintbrush" }, "Hai màu trộn với nhau thì ra màu gì? Con kéo màu vào ô trống nhé.", "Pha màu"),
  n(31, "ai-day-nhi", "gia-dinh", "Ai đây nhỉ?", "listen-choose", "2–4", { item: "grandma" }, "Con nghe tên người trong nhà, rồi chạm vào người đó nhé.", "Ai đây nhỉ?"),
  n(32, "tu-be-den-lon", "gia-dinh", "Từ bé đến lớn", "sequence", "4–5", { item: "baby" }, "Con xếp mọi người từ nhỏ tuổi nhất đến lớn tuổi nhất nhé.", "Từ bé đến lớn"),
  n(33, "lat-the-ca-nha", "gia-dinh", "Lật thẻ cả nhà", "flip-cards", "3–6", { item: "mom" }, "Con lật hai thẻ. Nếu là cùng một người thì giữ lại nhé.", "Lật tìm hai thẻ cùng người"),
  n(34, "to-mau-cho-tranh", "nghe-thuat", "Tô màu cho tranh", "match-pairs", "3–5", { item: "palette" }, "Con chọn màu, rồi chạm vào tranh để tô cho đúng màu nhé.", "Tô màu cho tranh"),
  n(35, "nhac-cu", "nghe-thuat", "Nhạc cụ tên gì?", "listen-choose", "3–5", { item: "guitar" }, "Con nghe tên nhạc cụ, rồi chạm vào nhạc cụ đó nhé.", "Nhạc cụ"),
  n(36, "xau-vong", "nghe-thuat", "Xâu vòng hạt màu", "drag-fill", "4–6", { item: "flower" }, "Con nhìn các hạt màu, rồi xâu tiếp hạt cho đúng quy luật nhé.", "Hạt nào tiếp theo?"),
];

export const ALL_GAMES: readonly GameMeta[] = [...LANGUAGE_GAMES, ...GROUP_GAMES];

export function gamesForArea(area: AreaId): readonly GameMeta[] {
  return ALL_GAMES.filter((game) => game.area === area);
}

export function findGame(id: string | undefined): GameMeta | undefined {
  return ALL_GAMES.find((game) => game.id === id);
}

import type { TextStyle } from "react-native";

type TypographyToken = Readonly<Pick<TextStyle,
  "fontFamily" | "fontSize" | "fontStyle" | "fontWeight" | "letterSpacing" | "lineHeight" | "textTransform"
>>;

const systemSafeBase = {
  fontFamily: undefined,
  fontStyle: "normal",
  textTransform: "none",
} as const;

function token(style: Omit<TypographyToken, keyof typeof systemSafeBase>): TypographyToken {
  return { ...systemSafeBase, ...style };
}

export const namyTypography = {
  child: {
    display: token({ fontSize: 15, lineHeight: 20, fontWeight: "700", letterSpacing: 0.4 }),
    title: token({ fontSize: 34, lineHeight: 42, fontWeight: "700", letterSpacing: 0 }),
    body: token({ fontSize: 17, lineHeight: 25, fontWeight: "400", letterSpacing: 0 }),
    button: token({ fontSize: 17, lineHeight: 22, fontWeight: "700", letterSpacing: 0 }),
    caption: token({ fontSize: 13, lineHeight: 19, fontWeight: "600", letterSpacing: 0.2 }),
  },
  parent: {
    title: token({ fontSize: 30, lineHeight: 38, fontWeight: "700", letterSpacing: 0 }),
    body: token({ fontSize: 16, lineHeight: 24, fontWeight: "400", letterSpacing: 0 }),
    label: token({ fontSize: 15, lineHeight: 21, fontWeight: "600", letterSpacing: 0.1 }),
  },
} as const;

export const namyTypographySource = {
  activeFamily: "Platform system default",
  webExpectedFamily: "system-ui (Segoe UI on Windows)",
  productionStatus: "PENDING USER APPROVAL",
} as const;

export const typographyQaPhrases = [
  "Chúc mừng con!",
  "Kéo chữ vào ô trống",
  "Chữ cái & vần",
  "Nghe lại hướng dẫn",
  "Con làm đúng rồi",
  "Con thử lại nhé",
  "Chơi mới",
  "Chơi lại",
  "Góc của ba mẹ",
  "Đang kiểm tra hành trình an toàn",
] as const;

export const vietnameseGlyphCorpus = "ă â ê ô ơ ư đ Ă Â Ê Ô Ơ Ư Đ á à ả ã ạ ắ ằ ẳ ẵ ặ ấ ầ ẩ ẫ ậ é è ẻ ẽ ẹ ế ề ể ễ ệ í ì ỉ ĩ ị ó ò ỏ õ ọ ố ồ ổ ỗ ộ ớ ờ ở ỡ ợ ú ù ủ ũ ụ ứ ừ ử ữ ự ý ỳ ỷ ỹ ỵ";

export function isNfcNormalized(value: string): boolean {
  return value.normalize("NFC") === value;
}

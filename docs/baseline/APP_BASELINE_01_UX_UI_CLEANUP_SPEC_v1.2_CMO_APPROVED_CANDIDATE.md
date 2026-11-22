# APP-BASELINE-01 — UX/UI & Child-Facing Language Cleanup Specification v1.2 CMO APPROVED CANDIDATE

Status: CMO APPROVED CANDIDATE FOR CODEX ONE-PASS IMPLEMENTATION  
Date: 2026-10-02  
Project: NamyKids App  
Baseline Target: Foundation Preview (`src/dev/FoundationPreview.tsx`) & Associated Presentation-Layer Files  
Scope: Presentation, Typography, Brand Colors, Micro-Feedback & Child-Safe Copy Only  
Authority: [APP_DES_04_INTERACTION_SCREEN_STATE_SPEC_v1.0.md](file:///e:/AI/APP%20Namykids/Namykids-app/docs/design/APP_DES_04_INTERACTION_SCREEN_STATE_SPEC_v1.0.md), [APP_TECH_05B_QUALITY_STRATEGY_v1.0.md](file:///e:/AI/APP%20Namykids/Namykids-app/docs/quality/APP_TECH_05B_QUALITY_STRATEGY_v1.0.md), [APP_BASELINE_01_TYPOGRAPHY_INTEGRITY_AUDIT_v1.0.md](file:///e:/AI/APP%20Namykids/Namykids-app/docs/baseline/APP_BASELINE_01_TYPOGRAPHY_INTEGRITY_AUDIT_v1.0.md).

---

## 1. Mục Đích & Nguyên Tắc Cốt Lõi

1. **Chuẩn bị gói đặc tả hoàn chỉnh (Implementation-Ready Spec):** Hướng dẫn Codex thực hiện sửa đổi triệt để toàn bộ tầng giao diện Foundation Preview trong **đúng một pass duy nhất**.
2. **100% Tiếng Việt Chuẩn Mầm Non:** Trẻ 2–6 tuổi chỉ nhìn thấy và nghe thấy ngôn từ tự nhiên, ấm áp, ngắn gọn; không có tiếng Anh, không có thuật ngữ kỹ thuật.
3. **Phân Loại Severity Chuẩn Mực:** Lỗi rò rỉ ngôn ngữ đánh giá nội bộ tại S05/S06 được xác định là **P1 — Foundation UX blocker**, không gọi là technical P0 vì không gây crash hay hỏng tính toàn vẹn dữ liệu hệ thống.
4. **Cách Ly Tuyệt Đối Dữ Liệu QA/Dev:** Toàn bộ thông tin gỡ lỗi (`DEV_PLACEHOLDER`, `no Auth · no DB`, `in-memory`), phân loại đánh giá (`Independent`, `Trial-and-error`, `Assisted`), và các nút điều hướng kiểm thử (`Typography QA`, `Restricted`, `Safe Recovery`) phải được đưa xuống **DEV Inspector** tách biệt.
5. **Đặc Tả DevInspector Đa Nền Tảng An Toàn:** DevInspector tuân thủ hợp đồng docked/overlay inspector với cross-platform-safe layout trên React Native và Web; không áp đặt cứng cú pháp Web-only fixed positioning.
6. **Tuân Thủ Implementation Token Authority & Brand Status:** Giữ nguyên semantic action mapping hiện có (`actionleaf` -> `namyColors.brand.primary`); ghi nhận palette màu là PROVISIONAL cho Foundation Preview, không tuyên bố là final User-approved baseline khi chưa có User Acceptance trực tiếp phê duyệt; không tự ý đổi mã màu.
7. **Không Đưa Governance Rule Vào UI:** Loại bỏ hoàn toàn các quy tắc quản trị hệ thống (như ghi chú "không dùng phần trăm giả lập") khỏi giao diện người dùng.
8. **Không Động Chạm Invariants:** Không sửa đổi Runtime, Auth, Database, API, GameSession reducer, E02 evaluation logic hay Content schema.

---

## 2. Bảng Rà Soát & Làm Sạch Giao Diện S01–S12 (Screen-by-Screen UI Cleanup Table)

| Screen / State | Hiện trạng trong Foundation Preview | Vấn đề / Lỗi | Trạng thái sau làm sạch (Target Clean UI) | Phân loại & Severity |
|---|---|---|---|---|
| **S01 — Child World** | `stateCode="DEV / S01"`, `description` chứa biệt ngữ ("fixture cục bộ, User Acceptance, Auth..."), `PreviewBanner` chèn đầu trang, Card 2 chứa 3 nút QA. | Trộn lẫn thông tin dev lên màn hình chính của bé; chiếm diện tích, gây bối rối cho trẻ. | `stateCode="S01"` trên canvas; `description="Hôm nay con muốn cùng gấu Nami học bài nào?"`; bỏ banner và Card 2 khỏi canvas trẻ; chỉ giữ lại 2 nút: `"Chữ cái & vần"` và `"Góc của ba mẹ"`. (Các nút QA chuyển xuống Dev Inspector). | **CHILD-FACING** (P1 UX blocker) |
| **S02 — Subject Journey** | `stateCode="DEV / S02"`, nút `"Bắt đầu lượt Missing Letters"`, nút `"Ngoại tuyến / đồng bộ an toàn"`, nút `"Quay về Child World"`, thẻ `<DevAssetNotice />`. | Tiếng Anh (`Missing Letters`, `Child World`); thuật ngữ hệ thống (`đồng bộ an toàn`, `ngoại tuyến`). | `stateCode="S02"`; `description="Cùng làm quen và sắp xếp các chữ cái thật vui nhé!"`; đúng 2 nút: `"Bắt đầu chơi"` (tone="leaf") và `"Quay lại"` (tone="paper"). Xóa bỏ các nút kỹ thuật khỏi màn hình bé. | **CHILD-FACING** (P1 UX blocker) |
| **S03 — Instruction** | `stateCode="DEV / S03"`, dòng note `"Hình và voice đang là DEV_PLACEHOLDER; đáp án chưa được tiết lộ."`, notice bấm nghe lại chứa `"Voice asset là DEV_PLACEHOLDER..."`. | Thuật ngữ dev hiển thị ngay dưới dãy chữ mẫu; audio notice lộ từ ngữ kỹ thuật. | `stateCode="S03"`; `title="Kéo chữ vào ô trống"`; `description="Nhìn dãy chữ theo thứ tự, rồi đặt mỗi chữ còn thiếu vào đúng chỗ nhé!"`. Xóa bỏ dòng note DEV_PLACEHOLDER trong card. Bấm nghe lại hiện notice dịu dàng: `"Giọng đọc mẫu đang chuẩn bị; con hãy nhìn hình và làm theo nhé!"`. | **CHILD-FACING** (P1 UX blocker) |
| **S04 — Active Learning** | `stateCode="DEV / S04"`, `PreviewBanner` đè trên đầu, nút Gợi ý có `accessibilityHint` tiếng Anh (`Reveal... assisted... genuine incorrect placement`). | Banner chiếm chỗ làm hẹp không gian kéo thả; TalkBack/VoiceOver đọc tiếng Anh chuyên môn. | `stateCode="S04"`; xóa bỏ `PreviewBanner` khỏi scene S04; helper text rõ ràng; `accessibilityHint` của Gợi ý được Việt hóa 100%: `"Mở một ô chữ giúp con"` (khi mở) và `"Nút gợi ý sẽ mở khi con cần trợ giúp"` (khi khóa). | **CHILD-FACING** (P1 UX blocker) |
| **S05 — Micro-Feedback Đúng** | Bubble hiện `"✓ Con làm đúng rồi  Independent"` (hoặc `Assisted`, `Trial-and-error · non-independent`). | Rò rỉ phân loại đánh giá tiếng Anh nội bộ ra UI của trẻ. | Bubble gọn nhẹ chỉ hiển thị: `"✓ Con làm đúng rồi"`. Nền xanh ngọc pastel (`#D9F8F3`), viền xanh ngọc (`#00D0B0`). Không blocking, tự động tiếp tục. Toàn bộ assessment status chuyển xuống DEV Inspector. | **CHILD-FACING** (**P1 — Foundation UX blocker**) |
| **S06 — Micro-Feedback Thử Lại** | Bubble hiện `"↩ Con thử lại nhé  Trial-and-error · non-independent"`. | Rò rỉ nhãn phân loại thử-sai tiếng Anh nội bộ ra UI của trẻ. | Bubble êm dịu chỉ hiển thị: `"↩ Con thử lại nhé"`. Nền vàng cam pastel (`#FFF6D9`), viền vàng cam (`#FFC000`). Không blocking, thẻ tự trượt về khay, trẻ có thể thao tác ngay. | **CHILD-FACING** (**P1 — Foundation UX blocker**) |
| **S07 — Completion** | Màn hình hoàn thành (hiện tại đã dùng `minimal` với 2 nút `"Chơi mới"`, `"Chơi lại"`). | Nhãn `stateCode="DEV / S07"`. | `stateCode="S07"`; `title="Chúc mừng con!"`; đúng 2 nút bấm chuẩn: `"Chơi mới"` (tone="leaf", đổi bộ chữ mới) và `"Chơi lại"` (tone="paper", chơi lại bộ vừa xong). Tuyệt đối không thêm sao tiền tệ hay mastery. | **CHILD-FACING** (P2 cosmetic) |
| **S08 — Loading** | `description` chứa `"khôi phục đúng child binding và content pin..."`. | Thuật ngữ backend/database rò rỉ khi tải trang. | `stateCode="S08"`; `title="Đang mở bài học..."`; `description="Bé chờ một chút xíu nhé, trò chơi sắp sẵn sàng rồi!"`. | **CHILD-FACING** (P1 UX blocker) |
| **S09 — Offline / Sync** | `description` chứa `"in-memory cô lập; không enqueue durable outbox và không gọi remote runtime..."`. | 100% biệt ngữ kỹ thuật hệ thống. | `stateCode="S09"`; `title="Chưa có kết nối mạng"`; `description="Bài học của bé vẫn được giữ lại an toàn. Khi có mạng trở lại, ứng dụng sẽ tự động cập nhật nhé!"`. Nút: `"Quay lại bài học"` và `"Góc của ba mẹ"`. | **PARENT/CHILD SAFE** (P1 UX blocker) |
| **S10 — Parent Zone** | `description` chứa `"preview in-memory, mastery"`; thẻ tiến độ chứa `"X placement đúng. Independent A; trial-and-error B; assisted C."`; nút disabled chứa governance copy. | Phụ huynh thấy token tiếng Anh thô thay vì báo cáo giáo dục trực quan; governance rule bị render thành nút UI. | `stateCode="S10"`; `eyebrow="NamyKids / Dành cho ba mẹ"`; `title="Góc của ba mẹ"`; `description="Theo dõi tiến độ học tập thực tế của bé một cách rõ ràng và chuẩn xác."`. Thẻ tiến độ Việt hóa chuẩn sư phạm. Bỏ hoàn toàn nút disabled "Báo cáo không sử dụng phần trăm giả lập". Duy nhất 1 nút: `"Quay lại không gian của bé"`. | **PARENT-FACING** (P1 UX blocker) |
| **S11 — Restricted** | `description` chứa `"Presentation-only state để nghiệm thu Restricted; preview không thay entitlement production"`, nút `"Xem Safe Recovery"`. | Thuật ngữ bản quyền kỹ thuật; tiếng Anh trên nút bấm. | `stateCode="S11"`; `title="Bài học đang chuẩn bị"`; `description="Bài học này tạm thời chưa mở. Bé hãy chọn các bài học vui khác đang sẵn sàng nhé!"`. Nút: `"Về trang chủ"`. | **CHILD-SAFE** (P1 UX blocker) |
| **S12 — Safe Recovery** | `description` chứa `"không tạo fake binding, token hoặc canonical outbox"`, nút `"Xem Offline / Sync"`. | Biệt ngữ `fake binding`, `token`, `canonical outbox`. | `stateCode="S12"`; `title="Mình đang giữ mọi thứ an toàn"`; `description="Đã có chút gián đoạn nhỏ, nhưng mọi tiến độ của bé vẫn được lưu lại an toàn. Ba mẹ hãy thử tải lại nhé!"`. Nút: `"Tải lại trang"` và `"Về trang chủ"`. | **PARENT/CHILD SAFE** (P1 UX blocker) |

---

## 3. Bản Chuẩn Ngôn Ngữ Tiếng Việt Cuối Cùng (Exact Final Vietnamese Copy)

### S01 — Child World
- **Tiêu đề:** `"Chào con đến với NamyKids"`
- **Mô tả:** `"Hôm nay con muốn cùng gấu Nami học bài nào?"`
- **Nút 1:** `"Chữ cái & vần"` (tone="leaf")
- **Nút 2:** `"Góc của ba mẹ"` (tone="paper")

### S02 — Subject Journey
- **Tiêu đề:** `"Chữ cái & vần"`
- **Mô tả:** `"Cùng làm quen và sắp xếp các chữ cái thật vui nhé!"`
- **Nút 1:** `"Bắt đầu chơi"` (tone="leaf")
- **Nút 2:** `"Quay lại"` (tone="paper")

### S03 — Instruction
- **Tiêu đề:** `"Kéo chữ vào ô trống"`
- **Mô tả:** `"Nhìn dãy chữ theo thứ tự, rồi đặt mỗi chữ còn thiếu vào đúng chỗ nhé!"`
- **Nút 1:** `"Nghe lại hướng dẫn"` (tone="paper")
- **Nút 2:** `"Bắt đầu"` (tone="leaf")
- **Thông báo audio dự phòng:** `"Giọng đọc mẫu đang chuẩn bị; con hãy nhìn hình và làm theo nhé!"`

### S04 — Active Learning
- **Tiêu đề:** `"Chữ cái còn thiếu"`
- **Mô tả:** `"Kéo thẻ chữ vào ô trống, hoặc chọn thẻ rồi chạm ô trống."`
- **Dòng trợ giúp 1 (khi chưa chọn thẻ):** `"Kéo hoặc chọn một thẻ chữ bên dưới."`
- **Dòng trợ giúp 2 (khi đã chọn thẻ):** `"Đã chọn [X]. Con hãy chạm một ô trống."`
- **Nút 1:** `"Gợi ý"` (tone="paper")
- **Nút 2:** `"Lượt mới"` (tone="paper")

### S05 — Micro-Feedback Đúng
- **Biểu tượng:** `✓`
- **Thông điệp:** `"Con làm đúng rồi"` *(Tuyệt đối không kèm bất kỳ nhãn nào như `Independent`, điểm số hay sao)*

### S06 — Micro-Feedback Thử Lại
- **Biểu tượng:** `↩`
- **Thông điệp:** `"Con thử lại nhé"` *(Tuyệt đối không kèm nhãn `Trial-and-error` hay phân loại lỗi)*

### S07 — Completion
- **Tiêu đề:** `"Chúc mừng con!"`
- **Nút 1:** `"Chơi mới"` (tone="leaf", tự động mở bộ vị trí khuyết mới)
- **Nút 2:** `"Chơi lại"` (tone="paper", chơi lại bộ vừa xong)

### S08 — Loading
- **Tiêu đề:** `"Đang mở bài học..."`
- **Mô tả:** `"Bé chờ một chút xíu nhé, trò chơi sắp sẵn sàng rồi!"`

### S09 — Offline / Sync
- **Tiêu đề:** `"Chưa có kết nối mạng"`
- **Mô tả:** `"Bài học của bé vẫn được giữ lại an toàn. Khi có mạng trở lại, ứng dụng sẽ tự động cập nhật nhé!"`
- **Nút 1:** `"Quay lại bài học"` (tone="leaf")
- **Nút 2:** `"Góc của ba mẹ"` (tone="paper")

### S10 — Parent Zone
- **Eyebrow:** `"NamyKids / Dành cho ba mẹ"`
- **Tiêu đề:** `"Góc của ba mẹ"`
- **Mô tả:** `"Theo dõi tiến độ học tập thực tế của bé một cách rõ ràng và chuẩn xác."`
- **Dòng tiến độ chính:** `"Lượt chơi vừa hoàn thành: [X] ô chữ đã điền đúng."`
- **Báo cáo chi tiết:**
  - `"• Tự làm đúng: [A] chữ"`
  - `"• Thử và tự sửa: [B] chữ"`
  - `"• Có gợi ý trợ giúp: [C] chữ"`
- **Nút duy nhất:** `"Quay lại không gian của bé"` (tone="leaf")
- *(Bỏ hoàn toàn nút disabled "Báo cáo không sử dụng phần trăm giả lập")*

### S11 — Restricted
- **Tiêu đề:** `"Bài học đang chuẩn bị"`
- **Mô tả:** `"Bài học này tạm thời chưa mở. Bé hãy chọn các bài học vui khác đang sẵn sàng nhé!"`
- **Nút:** `"Về trang chủ"` (tone="leaf")

### S12 — Safe Recovery
- **Tiêu đề:** `"Mình đang giữ mọi thứ an toàn"`
- **Mô tả:** `"Đã có chút gián đoạn nhỏ, nhưng mọi tiến độ của bé vẫn được lưu lại an toàn. Ba mẹ hãy thử tải lại nhé!"`
- **Nút 1:** `"Tải lại trang"` (tone="leaf")
- **Nút 2:** `"Về trang chủ"` (tone="paper")

---

## 4. Đặc Tả Tách Biệt DEV Inspector (DEV Inspector Architecture)

Toàn bộ các thành phần phục vụ kiểm thử kỹ thuật được gom về component `<DevInspector />`:

```
┌──────────────────────────────────────────────────────────┐
│ [CHILD-FACING CANVAS]                                    │
│ 100% Pure Vietnamese, Art-Directed, Child-Centered UI   │
│                                                          │
│ [ Dãy chữ cái theo thứ tự ]                               │
│ [ Micro-feedback bubble: "✓ Con làm đúng rồi" ]          │
│ [ Khay chữ cái di động ]                                 │
│ [ Nút: Gợi ý | Lượt mới ]                                │
└──────────────────────────────────────────────────────────┘
════════════════════════════════════════════════════════════
┌──────────────────────────────────────────────────────────┐
│ 🛠️ DEV INSPECTOR (Docked/Overlay Inspector, Subtle Dark)  │
│ State: S04 | Pin: dev-preview | Engine: E02              │
│ Assessment: Independent: 2 • Trial-error: 1 • Assisted: 0│
│ Typography: Platform Safe | Asset: DEV_PLACEHOLDER       │
│ Quick Nav: [S01] [S02] [S03] [S04] [S07] [S10] [Typo QA] │
└──────────────────────────────────────────────────────────┘
```

### Các mục di chuyển vào DEV Inspector:
1. `PreviewBanner` (4 dòng thông tin fixture, in-memory, font fallback, Step 8 logo).
2. Chuỗi phân loại đánh giá: `lastPlacement?.independentlyAssessable ? "Independent" : ...`.
3. Bộ đếm tóm tắt nội bộ: `summary.independentCorrectPlacements`, `summary.trialAndErrorCorrectPlacements`, `summary.assistedCorrectPlacements`.
4. Các nút điều hướng kiểm thử: `"Typography QA tiếng Việt"`, `"Xem Restricted"`, `"Xem Safe Recovery"`, `"Ngoại tuyến / đồng bộ an toàn"`.
5. Thông báo trạng thái tài nguyên: `DEV_PLACEHOLDER ASSETS notice`.

---

## 5. Quy Chuẩn Typography Toàn Ứng Dụng (Typography Rules)

1. **Token Trung Tâm Duy Nhất:** Toàn bộ text trong ứng dụng bắt buộc sử dụng token từ [src/ui/typography.ts](file:///e:/AI/APP%20Namykids/Namykids-app/src/ui/typography.ts):
   - `namyTypography.child.title`: 34px / lineHeight 42px / weight 700 (Tiêu đề trang của bé).
   - `namyTypography.child.body`: 17px / lineHeight 25px / weight 400 (Mô tả, lời dẫn).
   - `namyTypography.child.button`: 17px / lineHeight 22px / weight 700 (Nút bấm, chữ cái trên thẻ, micro-feedback).
   - `namyTypography.child.caption`: 13px / lineHeight 19px / weight 600 (Ghi chú nhỏ, phụ đề).
   - `namyTypography.parent.title`: 30px / lineHeight 38px / weight 700 (Tiêu đề góc ba mẹ).
   - `namyTypography.parent.body`: 16px / lineHeight 24px / weight 400 (Nội dung báo cáo ba mẹ).
2. **Quy Định Font:**
   - Sử dụng `Platform system default` (`system-ui` trên Web, Segoe UI trên Windows, San Francisco trên iOS, Roboto trên Android).
   - Tuyệt đối cấm đưa font tùy tiện hoặc font Georgia/Trebuchet MS cũ vào mã nguồn.
3. **Chuẩn Hóa Unicode Tiếng Việt:**
   - 100% chuỗi ký tự tiếng Việt phải đạt chuẩn chuẩn hóa `NFC` (`isNfcNormalized(str) === true`).
   - Tuyệt đối không tự tách dấu thanh (combining marks) và chữ cái cơ sở.

---

## 6. Quy Chuẩn Màu Thương Hiệu & Action Semantics (Brand Color Rules)

Tuân thủ nghiêm ngặt bảng mã màu và semantic action đã được thiết lập tại [src/ui/brand-tokens.ts](file:///e:/AI/APP%20Namykids/Namykids-app/src/ui/brand-tokens.ts) và [src/ui/NamyScene.tsx](file:///e:/AI/APP%20Namykids/Namykids-app/src/ui/NamyScene.tsx):

1. **Action Style Mapping Semantics (Implementation Token Authority):**
   - `actionleaf`: `{ backgroundColor: namyColors.brand.primary, borderColor: namyColors.border.strong }`  
     -> **Bắt buộc dùng `namyColors.brand.primary` (`#201080` - Deep Indigo)** theo implementation authority hiện tại. Tuyệt đối không tự ý hoán đổi sang `secondary`.
   - `actionsun`: `{ backgroundColor: namyColors.brand.accent, borderColor: namyColors.border.strong }`  
     -> Dùng `namyColors.brand.accent` (`#FFC000` - Warm Gold).
   - `actionpaper`: `{ backgroundColor: namyColors.surface.raised, borderColor: namyColors.border.default }`  
     -> Dùng `namyColors.surface.raised` (`#FFFFFF` - Pure White).
2. **Tình Trạng Phê Duyệt Màu Sắc (Brand Color Approval Status):**
   - Palette màu hiện tại là **current implementation token authority / PROVISIONAL for Foundation Preview**.
   - **KHÔNG tuyên bố palette là final User-approved brand baseline** cho đến khi User Acceptance trực tiếp phê duyệt (approve).
   - Tuyệt đối không thay đổi mã màu.
3. **Nền Bề Mặt (Surfaces):**
   - `namyColors.surface.base` (`#E0F0FF` - Sky Tint): Nền trang chính của trẻ em.
   - `namyColors.surface.raised` (`#FFFFFF` - Pure White): Nền các thẻ bài học (SceneCard).
   - `namyColors.surface.calm` (`#F0F0FF` - Soft Lavender): Nền tĩnh lặng cho Góc của ba mẹ (S10).
4. **Trạng Thái Micro-Feedback:**
   - Đúng (S05): Nền `namyColors.state.correctSurface` (`#D9F8F3`), viền `namyColors.state.correct` (`#00D0B0`), chữ `namyColors.text.primary` (`#201080`).
   - Thử lại (S06): Nền `namyColors.state.retrySurface` (`#FFF6D9`), viền `namyColors.state.retry` (`#FFC000`), chữ `namyColors.text.primary` (`#201080`).

---

## 7. Quy Chuẩn Tương Tác Vi Mô (Interaction Polish Rules)

1. **Non-Blocking Micro-Feedback trong S04:**
   - Đặt đúng: Thẻ chữ lập tức khóa vào ô đích với dấu tích `✓`, xuất hiện bubble `"✓ Con làm đúng rồi"`, phát âm thanh tích cực. Hệ thống **tự động chuyển tiếp** lượt mà không bắt trẻ chạm nút nào.
   - Đặt sai: Thẻ chữ tự động lướt về khay nhẹ nhàng bằng `withSpring(0)`, xuất hiện bubble `"↩ Con thử lại nhé"`, phát âm thanh khích lệ. Trẻ có thể **thao tác chọn lại ngay lập tức** mà không bị hộp thoại modal cản trở.
2. **Cơ Chế Trợ Giúp (Hint):**
   - Nút `"Gợi ý"` chỉ kích hoạt (enable) sau khi trẻ đã có ít nhất một lần đặt sai trong lượt (`hintEligible === true`).
   - Khi bấm gợi ý: tự động điền 1 chữ vào ô trống và đánh dấu `assisted=true`.
3. **Cơ Chế Đổi Lượt (Refresh):**
   - Nút `"Lượt mới"` chỉ khả dụng khi chưa có chữ nào được đặt (`Object.keys(placed).length === 0`). Khi trẻ đã đặt 1 chữ, nút tự động mờ đi để bảo toàn tính tập trung.
4. **Màn Hình Hoàn Thành (S07):**
   - Xuất hiện sau khi cả 3 vị trí khuyết đã được điền đúng.
   - Không có màn hình trung gian, không bảng điểm hay phân loại.
   - Nút `"Chơi mới"` tự động gọi `e02DragDropEngine.selectRefreshPositions` để tạo bộ khuyết mới.
   - Nút `"Chơi lại"` giữ nguyên bộ vị trí khuyết hiện tại.

---

## 8. Chuẩn Hóa Trợ Năng Bằng Tiếng Việt (Accessibility Copy)

Tất cả các nhãn và gợi ý trợ năng (VoiceOver / TalkBack) phải là tiếng Việt hoàn chỉnh, tự nhiên:

- **Thẻ chữ trong khay:**  
  `accessibilityRole="button"`  
  `accessibilityLabel="Kéo chữ [glyph] vào ô trống hoặc chạm để chọn"`  
  `accessibilityState={{ selected: isSelected }}`
- **Ô trống mục tiêu:**  
  `accessibilityRole="button"`  
  `accessibilityLabel="Ô trống [n]${filled ? ', chữ đã điền đúng' : selected ? ', chạm để đặt chữ ' + selected : ''}"`  
  `accessibilityHint="Chạm sau khi chọn thẻ, hoặc kéo thả thẻ vào đây"`
- **Nút Gợi ý:**  
  `accessibilityRole="button"`  
  `accessibilityLabel="Gợi ý"`  
  `accessibilityHint={hintEligible ? "Mở một ô chữ giúp con" : "Nút gợi ý sẽ mở khi con cần trợ giúp"}`
- **Nút Lượt mới:**  
  `accessibilityRole="button"`  
  `accessibilityLabel="Lượt mới"`  
  `accessibilityHint="Đổi một bộ vị trí chữ khuyết khác"`
- **Vùng phản hồi micro-feedback:**  
  `accessibilityLiveRegion="polite"`

---

## 9. Phân Định Phạm Vi Tệp Cho Codex (File Boundary Handoff)

### A. Danh sách tệp Codex ĐƯỢC PHÉP CHỈNH SỬA (Exact Files Codex MAY Touch)
Chỉ thuộc tầng presentation, copy, token usage và tests liên quan:
1. `src/dev/FoundationPreview.tsx` (Trích xuất DevInspector, làm sạch S04 micro-feedback, cập nhật S01–S12 copy tiếng Việt).
2. `src/ui/NamyScene.tsx` (Nếu cần bổ sung container cho DevInspector hoặc hoàn thiện audience context / styling props).
3. `src/ui/typography.ts` và `src/ui/brand-tokens.ts` (Chỉ chỉnh sửa token usage nếu cần đảm bảo tính nhất quán của token presentation).
4. `src/runtime/activity-player/presentation.ts` (Nếu cần căn chỉnh chuỗi copy trợ năng hoặc child completion presentation).
5. `tests/activity-presentation.test.ts`, `tests/foundation-preview-guard.test.ts`, hoặc các file test UI/presentation liên quan (Cập nhật assertions cho khớp với chuỗi tiếng Việt đã làm sạch).

### B. Danh sách tệp Codex TUYỆT ĐỐI CẤM CHẠM (Exact Files Codex MUST NOT Touch)
1. `src/runtime/game-session/reducer.ts` và `src/runtime/game-session/contracts.ts` (GameSession state machine invariants).
2. `src/engines/e02-drag-drop/` (Toàn bộ logic E02 engine, drop evaluation, tray shuffle seed).
3. `src/runtime/activity-player/round-assessment.ts` (Logic phân biệt `independentlyAssessable`, `trial-and-error`, `assisted`).
4. `src/runtime/activity-player/completion-orchestrator.ts` và `src/runtime/activity-player/session-snapshot.ts`.
5. `src/runtime/runtime-bootstrap.ts` và `src/runtime/RuntimeBootstrapProvider.tsx`.
6. `src/auth/` (Web-Auth, RLS binding contracts).
7. `src/data/` (AppRuntimeClient, gateways).
8. `src/persistence/` (SecureDeviceStore, JsonSessionSnapshotRepository, JsonPendingCompletionRepository).
9. `src/sync/` (Outbox reconciliation).
10. `supabase/` (Migrations, database schema, RPC functions, pgTAP tests).

---

## 10. Bảng Đối Chiếu Copy Hoàn Chỉnh S01–S12 (Final S01–S12 Copy Matrix)

| State | Vị trí UI | Tiếng Việt Chuẩn Cuối Cùng | Phân loại |
|---|---|---|---|
| **S01** | Tiêu đề | `"Chào con đến với NamyKids"` | CHILD-FACING |
| **S01** | Mô tả | `"Hôm nay con muốn cùng gấu Nami học bài nào?"` | CHILD-FACING |
| **S01** | Nút chính 1 | `"Chữ cái & vần"` | CHILD-FACING |
| **S01** | Nút phụ 2 | `"Góc của ba mẹ"` | CHILD-FACING |
| **S02** | Tiêu đề | `"Chữ cái & vần"` | CHILD-FACING |
| **S02** | Mô tả | `"Cùng làm quen và sắp xếp các chữ cái thật vui nhé!"` | CHILD-FACING |
| **S02** | Nút chính 1 | `"Bắt đầu chơi"` | CHILD-FACING |
| **S02** | Nút phụ 2 | `"Quay lại"` | CHILD-FACING |
| **S03** | Tiêu đề | `"Kéo chữ vào ô trống"` | CHILD-FACING |
| **S03** | Mô tả | `"Nhìn dãy chữ theo thứ tự, rồi đặt mỗi chữ còn thiếu vào đúng chỗ nhé!"` | CHILD-FACING |
| **S03** | Nút phụ 1 | `"Nghe lại hướng dẫn"` | CHILD-FACING |
| **S03** | Nút chính 2 | `"Bắt đầu"` | CHILD-FACING |
| **S03** | Audio fallback | `"Giọng đọc mẫu đang chuẩn bị; con hãy nhìn hình và làm theo nhé!"` | CHILD-FACING |
| **S04** | Tiêu đề | `"Chữ cái còn thiếu"` | CHILD-FACING |
| **S04** | Mô tả | `"Kéo thẻ chữ vào ô trống, hoặc chọn thẻ rồi chạm ô trống."` | CHILD-FACING |
| **S04** | Trợ giúp 1 | `"Kéo hoặc chọn một thẻ chữ bên dưới."` | CHILD-FACING |
| **S04** | Trợ giúp 2 | `"Đã chọn [X]. Con hãy chạm một ô trống."` | CHILD-FACING |
| **S04** | Nút chức năng 1 | `"Gợi ý"` | CHILD-FACING |
| **S04** | Nút chức năng 2 | `"Lượt mới"` | CHILD-FACING |
| **S05** | Micro-feedback | `✓` `"Con làm đúng rồi"` | CHILD-FACING |
| **S06** | Micro-feedback | `↩` `"Con thử lại nhé"` | CHILD-FACING |
| **S07** | Tiêu đề | `"Chúc mừng con!"` | CHILD-FACING |
| **S07** | Nút chính 1 | `"Chơi mới"` | CHILD-FACING |
| **S07** | Nút phụ 2 | `"Chơi lại"` | CHILD-FACING |
| **S08** | Tiêu đề | `"Đang mở bài học..."` | CHILD-FACING |
| **S08** | Mô tả | `"Bé chờ một chút xíu nhé, trò chơi sắp sẵn sàng rồi!"` | CHILD-FACING |
| **S09** | Tiêu đề | `"Chưa có kết nối mạng"` | PARENT/CHILD SAFE |
| **S09** | Mô tả | `"Bài học của bé vẫn được giữ lại an toàn. Khi có mạng trở lại, ứng dụng sẽ tự động cập nhật nhé!"` | PARENT/CHILD SAFE |
| **S09** | Nút 1 & 2 | `"Quay lại bài học"` / `"Góc của ba mẹ"` | PARENT/CHILD SAFE |
| **S10** | Tiêu đề | `"Góc của ba mẹ"` (Eyebrow: `"NamyKids / Dành cho ba mẹ"`) | PARENT-FACING |
| **S10** | Mô tả | `"Theo dõi tiến độ học tập thực tế của bé một cách rõ ràng và chuẩn xác."` | PARENT-FACING |
| **S10** | Thẻ tiến độ | `"Lượt chơi vừa hoàn thành: [X] ô chữ đã điền đúng."` | PARENT-FACING |
| **S10** | Dòng chi tiết 1 | `"• Tự làm đúng: [A] chữ"` | PARENT-FACING |
| **S10** | Dòng chi tiết 2 | `"• Thử và tự sửa: [B] chữ"` | PARENT-FACING |
| **S10** | Dòng chi tiết 3 | `"• Có gợi ý trợ giúp: [C] chữ"` | PARENT-FACING |
| **S10** | Nút duy nhất | `"Quay lại không gian của bé"` | PARENT-FACING |
| **S11** | Tiêu đề | `"Bài học đang chuẩn bị"` | CHILD-SAFE |
| **S11** | Mô tả | `"Bài học này tạm thời chưa mở. Bé hãy chọn các bài học vui khác đang sẵn sàng nhé!"` | CHILD-SAFE |
| **S11** | Nút | `"Về trang chủ"` | CHILD-SAFE |
| **S12** | Tiêu đề | `"Mình đang giữ mọi thứ an toàn"` | PARENT/CHILD SAFE |
| **S12** | Mô tả | `"Đã có chút gián đoạn nhỏ, nhưng mọi tiến độ của bé vẫn được lưu lại an toàn. Ba mẹ hãy thử tải lại nhé!"` | PARENT/CHILD SAFE |
| **S12** | Nút 1 & 2 | `"Tải lại trang"` / `"Về trang chủ"` | PARENT/CHILD SAFE |

---

## 11. Hợp Đồng Thiết Kế DEV Inspector (Final DEV Inspector Contract)

1. **Vị Trí & Bố Cục (Contract):**
   - Component: `<DevInspector />` là **DEV-only docked/overlay inspector, implemented with cross-platform-safe layout**.
   - Implementation trên React Native / Web được phép sử dụng container dạng docked hoặc absolute phù hợp với từng nền tảng, không áp đặt cứng cú pháp Web-only fixed positioning.
   - Giao diện: Tách biệt hoàn toàn khỏi child canvas, sử dụng dark subtle tint (`backgroundColor: "#1B1736"`, viền trên `borderColor: "#3D3766"`), chữ nhỏ gọn, tương phản tốt cho QA nhưng không che khuất các phần tử tương tác học tập của trẻ em.
2. **Nội Dung Trưng Bày:**
   - **Thẻ định danh:** `DEV INSPECTOR • PREVIEW HARNESS`
   - **Thông số Runtime:** `Màn hình: S04 | Động cơ: E02 | Dữ liệu: In-Memory`
   - **Chỉ số Đánh Giá Trực Tiếp:** `Độc lập: [X] • Thử-sai: [Y] • Có hỗ trợ: [Z]`
   - **Trạng thái Tài nguyên & Font:** `Font: System Safe | Asset: DEV_PLACEHOLDER`
   - **Bộ Điều Hướng Nhanh (Pills):** Các nút bấm nhỏ chuyển cảnh trực tiếp: `[S01] [S02] [S03] [S04] [S07] [S10] [Typography QA] [Restricted] [Recovery]`.
3. **Cơ Chế Kích Hoạt (Condition):**
   - Chỉ được mount khi `isFoundationPreviewEnabled() === true`.
   - Trong môi trường production hoặc khi cờ `EXPO_PUBLIC_ENABLE_FOUNDATION_PREVIEW` tắt, component tự động unmount 100%, không để lại dấu vết trên UI.

---

## 12. Danh Mục Kiểm Tra Nghiệm Thu Cuối Cùng (Final Acceptance Checklist)

Trước khi đóng APP-BASELINE-01, việc thực thi của Codex phải đạt 100% các tiêu chí sau:

- [ ] **1. Không còn tiếng Anh trên Child/Parent Canvas:** Không còn bất kỳ từ nào như `Independent`, `Trial-and-error`, `Assisted`, `Missing Letters`, `Child World`, `Auth`, `outbox`, `token` trong giao diện người dùng.
- [ ] **2. Micro-feedback S04 gọn nhẹ:** Đặt đúng chỉ hiện `"✓ Con làm đúng rồi"`, đặt sai chỉ hiện `"↩ Con thử lại nhé"`; không chặn màn hình.
- [ ] **3. Hoàn thành S07 tối giản:** Duy nhất tiêu đề `"Chúc mừng con!"` và 2 nút `"Chơi mới"`, `"Chơi lại"`.
- [ ] **4. Góc ba mẹ S10 chuẩn sư phạm:** Hiển thị 3 chỉ số Việt hóa rõ ràng; không có nút disabled chứa quy tắc quản trị "không dùng phần trăm giả lập".
- [ ] **5. Giữ vững Action Semantics:** Nút `actionleaf` giữ nguyên token `namyColors.brand.primary`.
- [ ] **6. DEV Inspector tách biệt:** Toàn bộ banner kỹ thuật và nút QA nằm ở docked/overlay inspector đa nền tảng, tách rời khỏi scene của trẻ.
- [ ] **7. Trợ năng tiếng Việt tự nhiên:** Nhãn `accessibilityLabel` và `accessibilityHint` thuần tiếng Việt, không còn từ `Reveal`, `assisted`, `genuine incorrect placement`.
- [ ] **8. Giữ nguyên Invariants:** Logic reducer, đánh giá E02, session snapshot, outbox idempotency và schema không bị thay đổi.
- [ ] **9. Bộ kiểm thử vượt qua hoàn toàn:** `npm test`, `npm run typecheck`, `npm run lint`, `npm run quality:static`, `npm run build:web` đều đạt kết quả PASS 100%.

---

## 13. Quyết Nghị Phê Duyệt Trước Thực Thi (CMO Pre-Implementation Status)

**CMO PRE-IMPLEMENTATION STATUS: READY FOR CODEX WITH USER VISUAL ACCEPTANCE STILL PENDING**

- Đã loại bỏ 100% tiếng Anh / debug leaks khỏi child-facing & parent-facing UI.
- Đã chuẩn hóa mức độ nghiêm trọng thành `P1 — Foundation UX blocker` cho rò rỉ ngôn ngữ S05/S06 (không gọi là technical P0).
- Đã cô lập DEV Inspector thành docked/overlay inspector với cross-platform-safe layout trên React Native & Web.
- Đã khóa chặt phạm vi tệp Codex ĐƯỢC PHÉP CHẠM (presentation layer) và TUYỆT ĐỐI CẤM CHẠM (core logic).
- Đã bảo lưu toàn vẹn các bất biến kiến trúc (invariants), thuật toán E02, session reducer và outbox idempotency.
- Palette màu và visual asset được ghi nhận là PROVISIONAL cho Foundation Preview và chờ User Acceptance chính thức phê duyệt.

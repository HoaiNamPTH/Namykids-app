# APP-BASELINE-01 — UX/UI & Child-Facing Language Cleanup Specification v1.0

Status: APPROVED SPECIFICATION FOR CODEX ONE-PASS IMPLEMENTATION  
Date: 2026-10-01  
Project: NamyKids App  
Baseline Target: Foundation Preview (`src/dev/FoundationPreview.tsx`) & Associated UI Components  
Scope: Presentation, Typography, Brand Colors, Micro-Feedback & Child-Safe Copy Only  
Authority: [APP_DES_04_INTERACTION_SCREEN_STATE_SPEC_v1.0.md](file:///e:/AI/APP%20Namykids/Namykids-app/docs/design/APP_DES_04_INTERACTION_SCREEN_STATE_SPEC_v1.0.md), [APP_TECH_05B_QUALITY_STRATEGY_v1.0.md](file:///e:/AI/APP%20Namykids/Namykids-app/docs/quality/APP_TECH_05B_QUALITY_STRATEGY_v1.0.md), [APP_BASELINE_01_TYPOGRAPHY_INTEGRITY_AUDIT_v1.0.md](file:///e:/AI/APP%20Namykids/Namykids-app/docs/baseline/APP_BASELINE_01_TYPOGRAPHY_INTEGRITY_AUDIT_v1.0.md).

---

## 1. Mục Đích & Nguyên Tắc Cốt Lõi

1. **Chuẩn bị gói đặc tả hoàn chỉnh (Implementation-Ready Spec):** Giúp Codex chỉnh sửa triệt để toàn bộ tầng giao diện Foundation Preview trong **đúng một pass duy nhất**.
2. **100% Tiếng Việt Chuẩn Mầm Non:** Trẻ 2–6 tuổi chỉ nhìn thấy và nghe thấy ngôn từ tự nhiên, ấm áp, ngắn gọn; không có tiếng Anh, không có thuật ngữ kỹ thuật.
3. **Cách Ly Tuyệt Đối Dữ Liệu QA/Dev:** Toàn bộ thông tin gỡ lỗi (`DEV_PLACEHOLDER`, `no Auth · no DB`, `in-memory`), phân loại đánh giá (`Independent`, `Trial-and-error`, `Assisted`), và các nút điều hướng kiểm thử (`Typography QA`, `Restricted`, `Safe Recovery`) phải được đưa xuống **DEV Inspector Dock** riêng ở đáy màn hình.
4. **Không Động Chạm Invariants:** Không sửa đổi Runtime, Auth, Database, API, GameSession reducer, E02 evaluation logic hay Content schema.

---

## 2. Bảng Rà Soát & Làm Sạch Giao Diện S01–S12 (Screen-by-Screen UI Cleanup Table)

| Screen / State | Thành phần hiện tại | Vấn đề / Lỗi | Trạng thái sau làm sạch (Target Clean UI) | Phân loại |
|---|---|---|---|---|
| **S01 — Child World** | `stateCode="DEV / S01"`, `description` kỹ thuật ("fixture cục bộ, User Acceptance, Auth..."), `PreviewBanner` chèn đầu trang, Card 2 chứa 3 nút QA. | Trộn lẫn thông tin dev lên màn hình chính của bé; chiếm diện tích, gây bối rối cho trẻ. | `stateCode="S01"` trên canvas; `description="Hôm nay con muốn cùng gấu Nami học bài nào?"`; bỏ banner và Card 2 khỏi canvas trẻ; chỉ giữ lại 2 nút: `"Chữ cái & vần"` và `"Góc của ba mẹ"`. (Các nút QA chuyển sang Dev Inspector). | **CHILD-FACING** thuần khiết |
| **S02 — Subject Journey** | `stateCode="DEV / S02"`, nút `"Bắt đầu lượt Missing Letters"`, nút `"Ngoại tuyến / đồng bộ an toàn"`, nút `"Quay về Child World"`, thẻ `<DevAssetNotice />`. | Tiếng Anh (`Missing Letters`, `Child World`); thuật ngữ hệ thống (`đồng bộ an toàn`, `ngoại tuyến`). | `stateCode="S02"`; `description="Cùng làm quen và sắp xếp các chữ cái thật vui nhé!"`; đúng 2 nút: `"Bắt đầu chơi"` (tone="leaf") và `"Quay lại"` (tone="paper"). Xóa bỏ các nút kỹ thuật khỏi màn hình bé. | **CHILD-FACING** |
| **S03 — Instruction** | `stateCode="DEV / S03"`, dòng note `"Hình và voice đang là DEV_PLACEHOLDER; đáp án chưa được tiết lộ."`, notice bấm nghe lại chứa `"Voice asset là DEV_PLACEHOLDER..."`. | Thuật ngữ dev hiển thị ngay dưới dãy chữ mẫu; audio notice lộ từ ngữ kỹ thuật. | `stateCode="S03"`; `title="Kéo chữ vào ô trống"`; `description="Nhìn dãy chữ theo thứ tự, rồi đặt mỗi chữ còn thiếu vào đúng chỗ nhé!"`. Xóa bỏ dòng note DEV_PLACEHOLDER trong card. Bấm nghe lại hiện notice dịu dàng: `"Giọng đọc mẫu đang chuẩn bị; con hãy nhìn hình và làm theo nhé!"`. | **CHILD-FACING** |
| **S04 — Active Learning** | `stateCode="DEV / S04"`, `PreviewBanner` đè trên đầu, nút Gợi ý có `accessibilityHint` tiếng Anh (`Reveal... assisted... genuine incorrect placement`). | Banner chiếm chỗ làm hẹp không gian kéo thả; TalkBack/VoiceOver đọc tiếng Anh chuyên môn. | `stateCode="S04"`; xóa bỏ `PreviewBanner` khỏi scene S04; helper text rõ ràng; `accessibilityHint` của Gợi ý được Việt hóa 100%: `"Mở một ô chữ giúp con"` (khi mở) và `"Nút gợi ý sẽ mở khi con cần giúp"` (khi khóa). | **CHILD-FACING** |
| **S05 — Micro-Feedback Đúng** | Bubble hiện `"✓ Con làm đúng rồi  Independent"` (hoặc `Assisted`, `Trial-and-error · non-independent`). | **Lỗi P0:** Rò rỉ phân loại đánh giá tiếng Anh nội bộ ra UI của trẻ. | Bubble gọn nhẹ chỉ hiển thị: `"✓ Con làm đúng rồi"`. Nền xanh ngọc pastel (`#D9F8F3`), viền xanh ngọc (`#00D0B0`). Không blocking, tự động tiếp tục. Toàn bộ assessment status chuyển xuống DEV Inspector. | **CHILD-FACING** |
| **S06 — Micro-Feedback Thử Lại** | Bubble hiện `"↩ Con thử lại nhé  Trial-and-error · non-independent"`. | **Lỗi P0:** Rò rỉ nhãn `Trial-and-error · non-independent`. | Bubble êm dịu chỉ hiển thị: `"↩ Con thử lại nhé"`. Nền vàng cam pastel (`#FFF6D9`), viền vàng cam (`#FFC000`). Không blocking, thẻ tự trượt về khay, trẻ có thể thao tác ngay. | **CHILD-FACING** |
| **S07 — Completion** | Màn hình hoàn thành (hiện tại đã dùng `minimal` với 2 nút `"Chơi mới"`, `"Chơi lại"`). | Nhãn `stateCode="DEV / S07"`. | `stateCode="S07"`; `title="Chúc mừng con!"`; đúng 2 nút bấm chuẩn: `"Chơi mới"` (tone="leaf", đổi bộ chữ mới) và `"Chơi lại"` (tone="paper", chơi lại bộ vừa xong). Tuyệt đối không thêm sao tiền tệ hay mastery. | **CHILD-FACING** tối giản |
| **S08 — Loading** | `description` chứa `"khôi phục đúng child binding và content pin..."`. | Thuật ngữ backend/database rò rỉ khi tải trang. | `stateCode="S08"`; `title="Đang mở bài học..."`; `description="Bé chờ một chút xíu nhé, trò chơi sắp sẵn sàng rồi!"`. | **CHILD-FACING** |
| **S09 — Offline / Sync** | `description` chứa `"in-memory cô lập; không enqueue durable outbox và không gọi remote runtime..."`. | 100% biệt ngữ kỹ thuật hệ thống. | `stateCode="S09"`; `title="Chưa có kết nối mạng"`; `description="Bài học của bé vẫn được giữ lại an toàn. Khi có mạng trở lại, ứng dụng sẽ tự động cập nhật nhé!"`. Nút: `"Quay lại"` và `"Góc của ba mẹ"`. | **PARENT/CHILD SAFE** |
| **S10 — Parent Zone** | `description` chứa `"preview in-memory, mastery"`; thẻ tiến độ chứa `"X placement đúng. Independent A; trial-and-error B; assisted C."`. | Phụ huynh thấy token tiếng Anh thô thay vì báo cáo giáo dục trực quan. | `stateCode="S10"`; `eyebrow="NamyKids / Dành cho ba mẹ"`; `title="Góc của ba mẹ"`; `description="Theo dõi tiến độ học tập thực tế của bé một cách rõ ràng và chuẩn xác."`. Thẻ tiến độ Việt hóa: `"Lượt chơi vừa hoàn thành: X chữ đúng • Tự làm đúng: A • Thử và tự sửa: B • Có gợi ý: C"`. | **PARENT-FACING** |
| **S11 — Restricted** | `description` chứa `"Presentation-only state để nghiệm thu Restricted; preview không thay entitlement production"`, nút `"Xem Safe Recovery"`. | Thuật ngữ bản quyền kỹ thuật; tiếng Anh trên nút bấm. | `stateCode="S11"`; `title="Bài học đang chuẩn bị"`; `description="Bài học này tạm thời chưa mở. Bé hãy chọn các bài học vui khác đang sẵn sàng nhé!"`. Nút: `"Về trang chủ"`. | **CHILD-SAFE** |
| **S12 — Safe Recovery** | `description` chứa `"không tạo fake binding, token hoặc canonical outbox"`, nút `"Xem Offline / Sync"`. | Biệt ngữ `fake binding`, `token`, `canonical outbox`. | `stateCode="S12"`; `title="Mình đang giữ mọi thứ an toàn"`; `description="Đã có chút gián đoạn nhỏ, nhưng mọi tiến độ của bé vẫn được lưu lại an toàn. Ba mẹ hãy thử tải lại nhé!"`. Nút: `"Tải lại trang"` và `"Về trang chủ"`. | **PARENT/CHILD SAFE** |

---

## 3. Bản Chuẩn Ngôn Ngữ Tiếng Việt Cuối Cùng (Exact Final Vietnamese Copy)

### S01 Child World
- **Tiêu đề:** `"Chào con đến với NamyKids"`
- **Mô tả:** `"Hôm nay con muốn cùng gấu Nami học bài nào?"`
- **Hành động 1:** `"Chữ cái & vần"` (Mở hành trình chữ cái)
- **Hành động 2:** `"Góc của ba mẹ"` (Dành cho người lớn)

### S02 Subject Journey
- **Tiêu đề:** `"Chữ cái & vần"`
- **Mô tả:** `"Cùng làm quen và sắp xếp các chữ cái thật vui nhé!"`
- **Hành động 1:** `"Bắt đầu chơi"`
- **Hành động 2:** `"Quay lại"`

### S03 Instruction
- **Tiêu đề:** `"Kéo chữ vào ô trống"`
- **Mô tả:** `"Nhìn dãy chữ theo thứ tự, rồi đặt mỗi chữ còn thiếu vào đúng chỗ nhé!"`
- **Hành động 1:** `"Nghe lại hướng dẫn"`
- **Hành động 2:** `"Bắt đầu"`
- **Thông báo audio fallback:** `"Giọng đọc mẫu đang chuẩn bị; con hãy nhìn hình và làm theo nhé!"`

### S04 Active Learning
- **Tiêu đề:** `"Chữ cái còn thiếu"`
- **Mô tả:** `"Kéo thẻ chữ vào ô trống, hoặc chọn thẻ rồi chạm ô trống."`
- **Dòng trợ giúp 1 (chưa chọn):** `"Kéo hoặc chọn một thẻ chữ bên dưới."`
- **Dòng trợ giúp 2 (đã chọn):** `"Đã chọn [X]. Con hãy chạm một ô trống."`
- **Hành động 1:** `"Gợi ý"`
- **Hành động 2:** `"Lượt mới"`

### S05 Micro-Feedback Đúng
- **Biểu tượng:** `✓`
- **Thông điệp:** `"Con làm đúng rồi"`
- *(Tuyệt đối không kèm nhãn đánh giá hay điểm số)*

### S06 Micro-Feedback Thử Lại
- **Biểu tượng:** `↩`
- **Thông điệp:** `"Con thử lại nhé"`
- *(Tuyệt đối không kèm nhãn phân loại lỗi hay phạt)*

### S07 Completion
- **Tiêu đề:** `"Chúc mừng con!"`
- **Hành động 1:** `"Chơi mới"` (Lấy bộ chữ khuyết mới)
- **Hành động 2:** `"Chơi lại"` (Chơi lại bộ chữ vừa xong)
- *(Không hiển thị màn hình trung gian, không điểm số)*

### S08 Loading
- **Tiêu đề:** `"Đang mở bài học..."`
- **Mô tả:** `"Bé chờ một chút xíu nhé, trò chơi sắp sẵn sàng rồi!"`

### S09 Offline / Sync
- **Tiêu đề:** `"Chưa có kết nối mạng"`
- **Mô tả:** `"Bài học của bé vẫn được giữ lại an toàn. Khi có mạng trở lại, ứng dụng sẽ tự động cập nhật nhé!"`
- **Hành động 1:** `"Quay lại bài học"`
- **Hành động 2:** `"Góc của ba mẹ"`

### S10 Parent Zone
- **Eyebrow:** `"NamyKids / Dành cho ba mẹ"`
- **Tiêu đề:** `"Góc của ba mẹ"`
- **Mô tả:** `"Theo dõi tiến độ học tập thực tế của bé một cách rõ ràng và chuẩn xác."`
- **Dòng tiến độ hoàn thành:** `"Lượt chơi vừa hoàn thành: [X] ô chữ đã điền đúng."`
- **Báo cáo chi tiết:**
  - `"• Tự làm đúng: [A] chữ"`
  - `"• Thử và tự sửa: [B] chữ"`
  - `"• Có gợi ý trợ giúp: [C] chữ"`
- **Hành động 1:** `"Quay lại không gian của bé"`
- **Hành động 2:** `"Báo cáo không sử dụng phần trăm giả lập"` (disabled)

### S11 Restricted
- **Tiêu đề:** `"Bài học đang chuẩn bị"`
- **Mô tả:** `"Bài học này tạm thời chưa mở. Bé hãy chọn các bài học vui khác đang sẵn sàng nhé!"`
- **Hành động:** `"Về trang chủ"`

### S12 Safe Recovery
- **Tiêu đề:** `"Mình đang giữ mọi thứ an toàn"`
- **Mô tả:** `"Đã có chút gián đoạn nhỏ, nhưng mọi tiến độ của bé vẫn được lưu lại an toàn. Ba mẹ hãy thử tải lại nhé!"`
- **Hành động 1:** `"Tải lại trang"`
- **Hành động 2:** `"Về trang chủ"`

---

## 4. Đặc Tả Tách Biệt DEV Inspector (DEV Inspector Architecture)

Toàn bộ các thành phần phục vụ kiểm thử kỹ thuật được gom về component `<DevInspector />` đặt cố định ở chân màn hình (bottom fixed dock):

```
┌──────────────────────────────────────────────────────────┐
│ [CHILD-FACING CANVAS]                                    │
│ 100% Pure Vietnamese, Art-Directed, Child-Centered UI   │
│                                                          │
│ [ Dãy chữ cái ]                                          │
│ [ Feedback bubble sạch: "✓ Con làm đúng rồi" ]           │
│ [ Khay chữ cái ]                                         │
│ [ Nút: Gợi ý | Lượt mới ]                                │
└──────────────────────────────────────────────────────────┘
════════════════════════════════════════════════════════════
┌──────────────────────────────────────────────────────────┐
│ 🛠️ DEV INSPECTOR (Docked Bottom Bar, Dark Subtle Surface) │
│ State: S04 | Pin: dev-preview | Engine: E02              │
│ Assessment: Independent: 2 • Trial-error: 1 • Assisted: 0│
│ Typography: Platform Safe | Asset: DEV_PLACEHOLDER       │
│ Screens: [S01] [S02] [S03] [S04] [S07] [S10] [Typography]│
└──────────────────────────────────────────────────────────┘
```

### Các mục di chuyển vào DEV Inspector:
1. `PreviewBanner` (4 dòng thông tin fixture, font, logo).
2. Chuỗi phân loại đánh giá: `lastPlacement?.independentlyAssessable ? "Independent" : ...`.
3. Bộ đếm tóm tắt nội bộ: `summary.independentCorrectPlacements`, `summary.trialAndErrorCorrectPlacements`, `summary.assistedCorrectPlacements`.
4. Các nút điều hướng kiểm thử: `"Typography QA tiếng Việt"`, `"Xem Restricted"`, `"Xem Safe Recovery"`, `"Ngoại tuyến / đồng bộ an toàn"`.
5. Thông báo trạng thái tài nguyên: `DEV_PLACEHOLDER ASSETS notice`.

---

## 5. Quy Chuẩn Typography Toàn Ứng Dụng (Typography Rules)

1. **Token Trung Tâm Duy Nhất:** Toàn bộ text trong ứng dụng bắt buộc sử dụng token từ [src/ui/typography.ts](file:///e:/AI/APP%20Namykids/Namykids-app/src/ui/typography.ts):
   - `namyTypography.child.title`: 34px / lineHeight 42px / weight 700 (Tiêu đề trang bé).
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

## 6. Quy Chuẩn Màu Thương Hiệu (Brand Color Rules)

Toàn bộ màu sắc áp dụng thống nhất từ [src/ui/brand-tokens.ts](file:///e:/AI/APP%20Namykids/Namykids-app/src/ui/brand-tokens.ts), trích xuất từ Step 8 Option 02 Primary Logo và Concept Soft CGI:

1. **Màu Nhận Diện Chính:**
   - `namyColors.brand.primary` (`#201080` - Deep Indigo): Dùng cho tiêu đề, viền nút chính, chữ đậm nét.
   - `namyColors.brand.secondary` (`#00D0B0` - Mint Teal): Dùng cho trạng thái đúng, viền hoàn thành, nút hành động chính (tone="leaf").
   - `namyColors.brand.accent` (`#FFC000` - Warm Gold): Dùng cho thẻ chữ cái trên khay, nút thử lại, trạng thái cần chú ý.
   - `namyColors.brand.info` (`#00A0FF` - Sky Blue): Dùng cho ô trống viền nét đứt, trạng thái thẻ đang được chọn.
2. **Nền Bề Mặt (Surfaces):**
   - `namyColors.surface.base` (`#E0F0FF` - Sky Tint): Nền trang chính của trẻ em.
   - `namyColors.surface.raised` (`#FFFFFF` - Pure White): Nền các thẻ bài học (SceneCard).
   - `namyColors.surface.calm` (`#F0F0FF` - Soft Lavender): Nền tĩnh lặng cho Góc của ba mẹ (S10).
3. **Trạng Thái Micro-Feedback:**
   - Đúng (S05): Nền `#D9F8F3`, viền `#00D0B0`, chữ `#201080`.
   - Thử lại (S06): Nền `#FFF6D9`, viền `#FFC000`, chữ `#201080`.

---

## 7. Quy Chuẩn Tương Tác Vi Mô (Interaction Polish Rules)

1. **Non-Blocking Micro-Feedback:**
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

## 9. Những Gì TUYỆT ĐỐI KHÔNG ĐƯỢC THAY ĐỔI (What Must NOT Change)

1. **State Machine & Reducer:** Giữ nguyên [src/runtime/game-session/reducer.ts](file:///e:/AI/APP%20Namykids/Namykids-app/src/runtime/game-session/reducer.ts) và toàn bộ các pha chuyển trạng thái (`IDLE -> INTRO -> ACTIVE -> FEEDBACK_POSITIVE/NEGATIVE -> ROUND_COMPLETE -> COMPLETING -> COMPLETED`).
2. **E02 Engine Contract:** Giữ nguyên [src/engines/e02-drag-drop/contracts.ts](file:///e:/AI/APP%20Namykids/Namykids-app/src/engines/e02-drag-drop/contracts.ts) với hàm `evaluateDrop` và `selectRefreshPositions`.
3. **Logic Đánh Giá Giáo Dục:** Giữ nguyên [src/runtime/activity-player/round-assessment.ts](file:///e:/AI/APP%20Namykids/Namykids-app/src/runtime/activity-player/round-assessment.ts) với logic phân biệt `independentlyAssessable` vs `trial-and-error` vs `assisted`.
4. **Lưu Trữ & Outbox Idempotency:** Giữ nguyên `JsonSessionSnapshotRepository` và `JsonPendingCompletionRepository`.
5. **Cơ Chế Khóa Cuộn Khi Kéo Thả:** Giữ nguyên `scrollEnabled={false}` trong trạng thái chơi S04 để chống lệch tọa độ.
6. **Kích Thước Vùng Chạm Mầm Non:** Giữ nguyên ô trống tối thiểu 72x72 pt, thẻ chữ 92x62 pt, nút bấm 52 pt.

---

## 10. Hướng Dẫn Thực Hiện Một Pass Cho Codex (One Implementation Handoff)

Codex có thể thực thi chính xác toàn bộ bản đặc tả này trong một file chính:

### File Mục Tiêu: `src/dev/FoundationPreview.tsx`
1. **Trích xuất `DevInspector` component:**  
   Tạo component `<DevInspector />` ở cuối file. Đưa `PreviewBanner`, nút QA S01 (`Typography QA`, `Restricted`, `Safe Recovery`), và hàng thông tin `assessment summary` xuống thanh dock này.
2. **Dọn sạch scene S04:**  
   Xóa `<Text style={styles.evidenceText}>...</Text>` trong `microFeedback` bubble tại dòng 222. Bubble chỉ còn lại icon và `microFeedback.message`.
3. **Cập nhật copy tiếng Việt toàn bộ S01–S12:**  
   Thay đổi các chuỗi ký tự theo đúng Bảng mục 3 ở trên (ví dụ: `"Bắt đầu lượt Missing Letters"` -> `"Bắt đầu chơi"`, `"Quay về Child World"` -> `"Quay lại"`).
4. **Cập nhật `accessibilityHint` của nút Gợi ý:**  
   Xóa bỏ chuỗi tiếng Anh `Reveal... assisted...`, thay bằng chuỗi tiếng Việt tại mục 8.
5. **Chạy bộ kiểm thử xác thực:**  
   - `npm test`
   - `npm run typecheck`
   - `npm run lint`
   - `npm run quality:static`
   - `npm run build:web`

# APP-DES-05 — Child Learning Landscape-First Visual & Interaction Direction v1.0

Status: USER APPROVED REVISION DIRECTIVE FOR IMPLEMENTATION  
Date: 2026-10-02  
Project: NamyKids App  
Scope: Child Learning Screens (S03 Instruction, S04 Active Learning, S07 Completion, and supporting S08/S09)  
Reference Authority: User-Approved NamyKids Soft CGI Concept Board ([ChatGPT Image Sep 24, 2026, 06_03_04 PM.png](file:///e:/AI/APP%20Namykids/ChatGPT%20Image%20Sep%2024,%202026,%2006_03_04%20PM.png))  
Replaces: Portrait-first vertical stacking for child learning activities  
Supervised By: CMO & User Decision Owner

---

## 1. Executive Summary & User Decision Alignment

Dựa trên chỉ đạo trực tiếp từ User Decision Owner:
1. **Giao diện bài học hiện tại chưa toát lên phong cách đích thực của NamyKids:** Cần chuyển đổi mạnh mẽ sang phong cách Storybook / Soft CGI 3D ấm áp, giàu cảm xúc, đưa nhân vật linh vật Nami & Niko vào bối cảnh thiên nhiên ngập tràn ánh nắng.
2. **Thanh "Nghe hướng dẫn" dạng thanh dài gây tốn diện tích và tạo nhiễu thị giác:** Được thay thế hoàn toàn bằng một **nút loa tròn nhỏ gọn (compact circular speaker button)** đặt tự nhiên ở góc trên.
3. **Chuyển dịch sang Landscape-First:** Toàn bộ luồng bài học của trẻ (S03 -> S04 -> S07) chuyển sang **định dạng ngang (landscape-first)** trên cả điện thoại và máy tính bảng (iPad/tablet), tạo ra một không gian học tập rộng mở, khoáng đạt, nhập tâm và tối ưu hóa tối đa diện tích tương tác kéo thả.

---

## 2. Layout Rationale (Lý Do Chuyển Đổi Sang Landscape)

### A. Giới Hạn Của Layout Dọc (Portrait) Cũ
- **Xếp chồng dọc quá tải (Vertical Clutter):** Thanh trạng thái -> Tiêu đề lớn -> Đoạn mô tả dài -> Dãy chữ -> Phản hồi -> Khay chữ -> Thanh nghe hướng dẫn dài 52pt -> Nút Gợi ý -> Nút Lượt mới.
- **Không gian thao tác bị bóp nghẹt:** Ô mục tiêu chỉ đạt 72pt, thẻ chữ bị chen chúc, ngón tay trẻ khi kéo thả dễ che khuất toàn bộ bài học phía trên.

### B. Ưu Điểm Tuyệt Đối Của Landscape-First
1. **Phù hợp với trực giác ngôn ngữ:** Bảng chữ cái và từ vựng tiếng Việt được đọc và sắp xếp theo trục ngang (trái qua phải). Bảng gỗ ngang (horizontal board) giúp trẻ dễ dàng quan sát toàn bộ trật tự chuỗi chữ cái.
2. **Giải phóng không gian học tập (75–80% Active Area):**
   - Ô mục tiêu (drop target) tăng lên **88x88 pt** (phone) và **104x104 pt** (iPad).
   - Thẻ chữ cái (tray letter tile) tăng lên **100x72 pt** (phone) và **120x90 pt** (iPad).
3. **Thao tác kéo thả công thái học (Ergonomic Upward Drag):** Khay chữ nằm ở đáy trung tâm, bảng mục tiêu nằm ngay phía trên. Trẻ kéo ngón tay thẳng đứng từ dưới lên trên, không bao giờ bị bàn tay che mất ô mục tiêu cần điền.
4. **Tối giản hóa toàn bộ Chrome hệ thống:** Nút quay lại và nút loa tròn đặt ở hai góc trên, loại bỏ hoàn toàn các thanh chữ cồng kềnh.

---

## 3. Bố Cục Chi Tiết S03 / S04 / S07

### S03 — Instruction Screen (Hướng dẫn cách chơi)
- **Bối cục ngang:**
  - Nền thiên nhiên 3D nắng ấm, đồi cỏ hoa nở rộ.
  - Trung tâm là bảng gỗ đồ chơi mộc mạc bo tròn gắn trên cọc gỗ.
  - Trên bảng gỗ hiển thị dãy chữ cái minh họa với ô khuyết `?`.
  - Bên phải bảng: Chú gấu Nami đứng tươi cười, tay chỉ vào bảng gỗ để làm mẫu cho bé.
  - Góc trên phải: Nút loa tròn nhỏ gọn (`46x46 pt`) viền vàng, bấm để nghe giọng đọc mẫu.
  - Góc trên trái: Nút quay lại hình tròn mềm mại (`44x44 pt`).
  - Đáy trung tâm: Nút bấm lớn hình viên thuốc: `"Bắt đầu"` (tone="leaf", bo góc 999px, chữ trắng đậm).

### S04 — Active Learning Screen (Chữ cái còn thiếu — Kéo thả)
- **Bố cục ngang:**
  - **Tầng trên (Sequence Board):** Bảng đám mây bằng gỗ sáng gắn ngang. Dãy 5–6 ô chữ: Ô đã có sẵn (A, C, E) là các khối đồ chơi 3D nổi rực rỡ; ô thiếu là các ô lõm dấu `?` viền nét đứt.
  - **Tầng dưới (Letter Tray):** Khay gỗ bo tròn đặt ngang ở đáy, chứa 3 khối thẻ chữ cái nổi 3D di động (B, D). Thẻ chữ cực lớn, nổi khối xúc giác (tactile toy feeling).
  - **Góc dưới trái:** Gấu Nami đứng ngấp nghé từ thảm cỏ vẫy tay khích lệ, hoàn toàn nằm ngoài vùng kéo thả.
  - **Góc trên phải:** Nút loa tròn (`46x46 pt`) để nghe lại âm thanh chữ cái.
  - **Góc trên trái:** Nút quay lại tròn (`44x44 pt`).
  - **Góc phải phụ trợ:** Nút "Gợi ý" (icon bóng đèn) và "Lượt mới" (icon xoay) thiết kế nhỏ gọn, không tranh chấp không gian.
  - **Micro-feedback:** Bong bóng mây nổi nhẹ (`✓ Con làm đúng rồi` hoặc `↩ Con thử lại nhé`), tự động lướt đi sau 0.8s, không chặn tương tác.

### S07 — Completion Screen (Chúc mừng con!)
- **Bố cục ngang:**
  - Bầu trời cầu vồng rực rỡ, đồng cỏ hoa ngập tràn ánh nắng.
  - Nami và Niko đứng cạnh nhau nhảy múa ăn mừng, sao vàng 3D và hoa giấy rơi lấp lánh.
  - Phía trên là bảng mây uốn lượn mang dòng chữ: `"Chúc mừng con!"`.
  - Phía dưới là đúng **2 nút bấm đồ chơi cỡ lớn** đặt song song:
    - `"Chơi mới"` (viên kẹo sắc màu / mint teal, nút chính to nổi bật).
    - `"Chơi lại"` (màu kem bơ viền gỗ ấm áp, nút phụ êm dịu).

---

## 4. Đặc Tả Tương Thích Thiết Bị & Nút Âm Thanh

### Phone Landscape (16:9 / 19.5:9)
- Safe Area Insets: padding ngang 44pt để tránh tai thỏ / Dynamic Island.
- Khoảng cách kéo từ khay lên bảng: ~85–100pt, cực kỳ vừa tầm ngón tay trẻ nhỏ.

### Tablet / iPad Landscape (4:3 / 16:10)
- Tận dụng chiều cao vượt trội để phóng to các khối chữ: ô đích `104x104 pt`, thẻ kéo `120x90 pt`.
- Nami và Niko có thể đứng hẳn trên thảm cỏ hai bên bảng chữ với chuyển động nhún nhảy nhẹ nhàng.

### Nút Loa Tròn (Compact Speaker Button)
- Kích thước: `46 x 46 pt` (tròn hoàn hảo, `borderRadius: 23pt`).
- Nền: `namyColors.surface.subtle` (`#FFF6D9`), viền `namyColors.brand.accent` (`#FFC000`), icon loa `#201080`.
- Hiệu ứng chạm: `scale: 0.92` khi pressed, nhả ra lò xo `1.0`.
- Vị trí: Cố định góc trên bên phải (`top: 14pt`, `right: 18pt`).

---

## 5. Implementation Notes Dành Cho Codex

1. **Orientation Handling:**
   - Kích hoạt khóa màn hình ngang khi vào các route bài học qua Expo ScreenOrientation API:
     `ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);`
   - Trả về tự do hoặc portrait khi thoát về Child World (`S01`) hoặc Parent Zone (`S10`).
2. **Không Gian Trình Bày (Clean Presentation Layer):**
   - Loại bỏ thanh chữ dài "Nghe lại hướng dẫn". Thay bằng `<CompactSpeakerButton onPress={replayAudio} />`.
   - Toàn bộ DEV Inspector tiếp tục được neo ở đáy (docked bottom/overlay inspector) và chỉ mount khi cờ preview bật.
3. **Bảo Lưu Invariants:**
   - Toàn bộ reducer, E02 evaluation, round-assessment, session snapshot, outbox reconciliation giữ nguyên 100%.
   - Copy tiếng Việt S01–S12 tuân thủ chính xác bản v1.2 CMO Approved Candidate.

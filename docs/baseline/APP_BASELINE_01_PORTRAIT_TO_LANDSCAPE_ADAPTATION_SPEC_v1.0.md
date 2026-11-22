# APP-BASELINE-01 — Portrait-to-Landscape Adaptation Specification v1.0

Status: APPROVED CANONICAL SPECIFICATION — LANDSCAPE ADAPTATION  
Date: 2026-10-02  
Project: NamyKids App  
Baseline Authority: User-Approved Portrait NamyKids UI ([ChatGPT Image Sep 24, 2026, 06_03_04 PM.png](file:///e:/AI/APP%20Namykids/ChatGPT%20Image%20Sep%2024,%202026,%2006_03_04%20PM.png))  
Scope: Landscape-First Adaptation for Child Learning Flow (S03 Instruction, S04 Active Learning, S07 Completion, and supporting S08/S09)  
Core Directive: **APPROVED PORTRAIT UI → SAME NAMYKIDS DESIGN → LANDSCAPE ADAPTATION** (NOT a redesign, NOT a new visual theme).  
Supervised By: CMO & User Decision Owner

---

## 1. Approved Portrait Visual Baseline Summary

Bản tham chiếu hình ảnh portrait chính thức ([ChatGPT Image Sep 24, 2026, 06_03_04 PM.png](file:///e:/AI/APP%20Namykids/ChatGPT%20Image%20Sep%2024,%202026,%2006_03_04%20PM.png)) đã được User phê duyệt toàn diện. Mọi màn hình landscape khi thích ứng bắt buộc phải bảo toàn trọn vẹn ADN thiết kế này:

1. **Bầu không khí & Bối cảnh (Scene & Environment):**
   - Không gian thiên nhiên tươi sáng ngập tràn nắng ấm: Bầu trời gradient pastel xanh dịu (`#E0F0FF` -> `#F0F8FF`), mây trắng bồng bềnh 3D, đồi cỏ xanh mướt uốn lượn điểm xuyết hoa cúc dại trắng/vàng.
   - Ánh sáng toàn cục êm dịu (soft global illumination), đổ bóng mềm tự nhiên, không có đường viền gắt hay góc nhọn.
2. **Ngôn ngữ Thẻ & Bề mặt (Cards & Surfaces):**
   - Thẻ trắng tinh khiết (`#FFFFFF`) hoặc màu kem ấm (`#FFFDF8`) với các góc bo tròn cực lớn (`borderRadius: 24–28pt`).
   - Đổ bóng mềm ba chiều (`shadowColor: #201080`, `shadowOpacity: 0.08–0.12`, `shadowRadius: 16–20pt`, `elevation: 3`).
3. **Nút bấm Hành động Chính (Primary CTA Button):**
   - Nút hình viên thuốc bo tròn hoàn hảo (`borderRadius: 999`, chiều cao `52pt`).
   - Tông màu xanh dương rực rỡ đặc trưng của NamyKids (`#0084FF` / `#1E88E5` hoặc `#201080`), chữ trắng đậm nét, hiệu ứng nổi khối nhẹ tạo cảm giác bấm xúc giác như đồ chơi cao cấp.
4. **Thẻ Chữ cái & Khối Đồ chơi Học tập (Tactile Learning Blocks):**
   - Các thẻ chữ vuông bo tròn mềm mại (`borderRadius: 20–24pt`), hiển thị chữ cái 3D dày dặn, nổi bật với các màu sắc tươi vui (Đỏ, Xanh dương, Vàng cam, Xanh lá, Tím).
   - Ô khuyết thể hiện bằng thẻ nền nhạt viền nét đứt và dấu hỏi chấm `?` thân thiện.
5. **Nút Điều Khiển Đầu Trang (Header Controls):**
   - Các nút icon tròn nhỏ gọn (đường kính `40–44pt`), nền trắng bo tròn nổi trên nền trời, icon màu xanh chàm hoặc vàng.
6. **Linh vật (Mascots):**
   - **Nami:** Chú gấu nâu ấm áp, mắt to tròn biểu cảm, mặc áo phông trắng bên trong yếm/hoodie vàng mang biểu tượng mặt gấu, balo xanh dương.
   - **Niko:** Chú tê giác tím pastel đáng yêu, sừng nhỏ xinh xắn, mặc áo thun xanh dương mang ngôi sao vàng, balo vàng.
   - Cả hai nhân vật được render 3D Soft CGI mượt mà, thân thiện, tràn ngập năng lượng tích cực.

---

## 2. Portrait → Landscape Transformation Principles

### A. Triết Lý Cốt Lõi: Bảo Toàn Danh Tính Thiết Kế
* **KHÔNG TỰ TẠO RA CONCEPT MỚI:** Không biến giao diện thành bảng gỗ mộc mạc kiểu trang trại, không thêm biển hiệu rustic, không đổi chất liệu thẻ trắng sang gỗ thô.
* **TÁI BỐ TRÍ THÔNG MINH (INTELLIGENT RECOMPOSITION):** Giữ nguyên vẹn các thành phần giao diện đã được duyệt (thẻ trắng bo tròn, chữ cái 3D, nút viên thuốc xanh dương, icon tròn), sắp xếp lại từ trục dọc sang trục ngang để tận dụng tối đa chiều rộng màn hình.
* **KHÔNG KÉO DÃN CO GIÃN TÙY TIỆN:** Không kéo dãn một thẻ bài tập từ 320pt thành một dải dài ngoằng 800pt. Thẻ học tập được giữ tỷ lệ đồ chơi xinh xắn, tăng kích thước vừa phải và đặt cạnh nhau theo luồng ngang tự nhiên.

### B. Chuyển Đổi Mô Hình Bố Cục (Vertical Stack → Horizontal Symphony)

```
[MÔ HÌNH DỌC CŨ (PORTRAIT STACK)]
         [Header Bar]
              ↓
      [Thanh Hướng Dẫn Dài]  <-- Cồng kềnh, tốn diện tích dọc
              ↓
       [Dãy Chữ Mục Tiêu]
              ↓
     [Micro-Feedback Bubble]
              ↓
         [Khay Chữ Cái]
              ↓
     [Nút Gợi Ý / Lượt Mới]
```

```
[MÔ HÌNH NGANG MỚI (LANDSCAPE ADAPTATION)]
┌────────────────────────────────────────────────────────────────────────┐
│ [<] Quay lại                                    [🔊] Nghe lại (44pt)   │
│ ────────────────────────────────────────────────────────────────────── │
│                                                                        │
│               [   DÃY CHỮ MỤC TIÊU (Thẻ trắng bo tròn lớn)   ]         │
│               [ A ]    [ ? ]    [ C ]    [ ? ]    [ E ]                │
│                                                                        │
│                     (✓ Con làm đúng rồi - Bubble nhẹ)                  │
│                                                                        │
│               [   KHAY CHỮ CÁI (Chữ 3D xúc giác nổi bật)     ]         │
│               [ B ]             [ D ]            [💡] [🔄]             │
│                                                                        │
│  (Gấu Nami đứng ở góc cỏ cổ vũ)                                        │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Đỉnh màn hình siêu thoáng (Lean Header):** Nút quay lại tròn `<` ở góc trên bên trái; nút loa tròn `🔊` ở góc trên bên phải.
2. **Khu vực trung tâm chiếm 80% màn hình:** Dãy ô chữ mục tiêu đặt ở nửa trên; khay chữ cái đặt ở nửa dưới.
3. **Thao tác kéo thẳng đứng tự nhiên (Ergonomic Upward Drag):** Bé kéo từ khay dưới lên ô trống ngay phía trên với khoảng cách ngắn (80–110pt), tay không che khuất màn hình.

---

## 3. Screen-by-Screen Adaptation Table

| Màn hình | Cấu trúc Portrait Gốc | Cấu trúc Landscape Thích Ứng | Thành phần Giữ Nguyên | Thành phần Thay Đổi Vị Trí / Bố Cục | Yếu tố Phóng To / Tối Ưu |
|---|---|---|---|---|---|
| **S01 — Child World** | Cột dọc cuộn trang: Hero banner -> 8 thẻ môn học xếp dọc -> Nút Góc ba mẹ. | Bố cục ngang: Bầu trời & đồi cỏ rộng mở; Nami & Niko đứng bên trái; lưới 2 hàng thẻ môn học 3D bo tròn bên phải; nút Góc ba mẹ ở góc trên. | Icon 3D môn học, phong cách thẻ trắng bo tròn, nút CTA xanh, nhân vật Nami/Niko. | Danh sách môn học chuyển từ 1 cột dọc sang lưới ngang 2 hàng dạng lướt (carousel/grid). | Thẻ môn học to rõ hơn, bối cảnh thiên nhiên hiển thị toàn cảnh. |
| **S02 — Subject Journey** | Bản đồ con đường xếp dọc uốn lượn từ dưới lên trên. | Bản đồ hành trình chữ cái trải dài theo chiều ngang từ trái sang phải băng qua đồi hoa. | Các mốc trạm học 3D (ngôi sao vàng, ổ khóa đồ chơi), avatar bé, mây trời. | Trục hành trình chuyển từ cuộn dọc sang cuộn ngang mượt mà (Horizontal Path). | Các trạm bài học có không gian thở rộng rãi, dễ chạm. |
| **S03 — Instruction** | Card trắng dọc, chữ cái nhỏ, thanh nghe hướng dẫn dài 52pt, nút Bắt đầu ở đáy. | Card trắng nằm ngang rộng rãi; dãy chữ A-?-C to rõ; Nami đứng cạnh chỉ tay; nút Bắt đầu viên thuốc xanh dương; nút loa tròn 🔊 ở góc trên. | Nền trời xanh mây trắng, typography bo tròn, màu chữ xanh chàm, nút CTA xanh dương. | Thanh nghe hướng dẫn biến thành nút loa tròn 🔊 ở góc trên; Nami chuyển từ chân trang sang đứng bên cạnh bảng. | Kích thước thẻ chữ mẫu tăng lên; bảng hướng dẫn thoáng đãng. |
| **S04 — Active Learning** | Xếp chồng 6 tầng dọc; khay chữ chen chúc dưới đáy; thẻ chữ 72pt; thanh công cụ chiếm chỗ. | Sân chơi ngang rộng mở; Dãy 6 ô chữ nằm trên trục ngang; khay 3 thẻ chữ 3D to bản nằm phía dưới; nút Gợi ý / Lượt mới nằm gọn bên phải; Nami đứng ở góc cỏ. | Thẻ chữ bo tròn, chữ cái 3D đa sắc, micro-feedback nhẹ nhàng, cơ chế kéo thả E02. | Dãy ô chữ và khay chữ trải rộng theo chiều ngang; nút loa tròn 🔊 nằm góc trên; nút điều khiển phụ gom gọn. | Ô mục tiêu tăng lên **88x88pt** (phone) / **104x104pt** (iPad); Thẻ kéo tăng lên **100x72pt** / **120x90pt**. |
| **S05 — Micro-Feedback** | Banner pop-up hoặc text chen giữa các tầng dọc. | Bong bóng nổi nhẹ hình viên thuốc mây (`✓ Con làm đúng rồi`) xuất hiện tinh tế ngay giữa dãy chữ và khay. | Màu sắc pastel (nền xanh ngọc `#D9F8F3`, viền `#00D0B0`), icon tích xanh, không chặn thao tác. | Đặt nổi lơ lửng (floating overlay) không đẩy lệch vị trí các ô chữ bên dưới. | Tự động biến mất mượt mà sau 0.8s. |
| **S06 — Micro-Feedback** | Banner pop-up hoặc text chiếm dòng. | Bong bóng nổi nhẹ (`↩ Con thử lại nhé`) màu vàng cam ấm áp; thẻ chữ trượt êm về khay bằng lò xo `withSpring(0)`. | Màu vàng cam `#FFF6D9`, viền `#FFC000`, chữ xanh chàm, không chặn thao tác. | Nổi lơ lửng trực tiếp trên vùng tương tác; không có nút "Thử lại" cản trở. | Thẻ chữ nảy nhẹ xúc giác vui mắt. |
| **S07 — Completion** | Khung dọc: Nami trên đỉnh -> Chúc mừng -> Nút bấm dọc. | Khung ngang lễ hội: Nami & Niko đứng giữa cầu vồng và sao vàng 3D; bảng chữ `"Chúc mừng con!"`; 2 nút lớn đặt song song (`"Chơi mới"` & `"Chơi lại"`). | Nhân vật ăn mừng, cầu vồng, sao vàng 3D, nút viên thuốc xanh dương và nút kem viền mỏng. | 2 nút bấm chuyển từ xếp chồng dọc sang đặt song song cạnh nhau trên thảm cỏ. | Không gian chúc mừng rực rỡ, cảm xúc trọn vẹn, không nhồi nhét điểm số. |
| **S08 — Loading** | Thẻ trắng dọc xoay tròn chờ tải. | Bầu trời ngang với đám mây 3D bồng bềnh lướt nhẹ, Nami nhún nhảy vui vẻ cùng dòng chữ: `"Đang mở bài học..."`. | Màu sắc, font chữ bo tròn, sắc thái ấm áp. | Căn giữa toàn màn hình ngang. | Hoạt họa mượt mà, không giật lag. |
| **S09 — Offline** | Thẻ trắng dọc thông báo mất kết nối. | Thẻ trắng ngang bo tròn mềm mại giữa đồng cỏ: `"Chưa có kết nối mạng"`, 2 nút viên thuốc song song: `"Quay lại bài học"` & `"Góc của ba mẹ"`. | Thẻ trắng bo góc lớn, nút viên thuốc, lời văn an ủi trẻ. | Nút chuyển sang dạng song song ngang. | Trực quan, dễ đọc, không làm bé sợ. |
| **S10 — Parent Zone** | Danh sách thẻ chỉ số dọc cuộn trang. | Giao diện tĩnh lặng (`#F0F0FF`) dạng 2 cột ngang: Cột trái tóm tắt tiến độ bé; Cột phải chi tiết sư phạm (Tự làm, Thử-sai, Có gợi ý). | Phong cách thanh lịch, chữ dễ đọc, không phần trăm giả lập, nút quay lại xanh chàm. | Chuyển từ cuộn 1 cột sang bố cục 2 cột cân đối cho phụ huynh. | Dễ quét thông tin trong 3 giây. |

---

## 4. Landscape Phone Layout (Điện Thoại Màn Hình Ngang)

Áp dụng cho tỷ lệ màn hình 16:9 đến 19.5:9 (iPhone, Samsung Galaxy, Xiaomi):

```
┌────────────────────────────────────────────────────────────────────────┐
│  ( < ) 44pt                                                  ( 🔊 ) 44pt│
│                                                                        │
│               [   DÃY CHỮ MỤC TIÊU (Sequence Board)   ]                │
│               [ A ]   [ ? ]   [ C ]   [ ? ]   [ E ]   [ ? ]            │
│               (Mỗi ô: 76x76pt, bo góc 20pt, khoảng cách 10pt)          │
│                                                                        │
│                     (✓ Con làm đúng rồi — Floating 36pt)               │
│                                                                        │
│                 [   KHAY CHỮ CÁI (Letter Tray)   ]                     │
│                 [  B  ]         [  D  ]         [  G  ]    [💡] [🔄]   │
│                 (Mỗi thẻ: 96x68pt, nổi khối 3D xúc giác)               │
│                                                                        │
│  [Gấu Nami góc trái]                                                   │
└────────────────────────────────────────────────────────────────────────┘
```

* **Vùng an toàn (Safe Area Insets):** Đệm padding ngang `44pt` hai bên để tránh hoàn toàn tai thỏ / Dynamic Island / camera đục lỗ.
* **Header Bar (Chiều cao 48pt):**
  - Góc trái: Nút tròn quay lại `<` (`44x44pt`, nền trắng bo tròn).
  - Góc phải: Nút tròn loa `🔊` (`44x44pt`, nền trắng bo tròn).
* **Vùng Tương Tác Trọng Tâm:**
  - Ô mục tiêu (drop target): Kích thước **`76 x 76 pt`**, bo góc `20pt`.
  - Thẻ chữ khay (letter tile): Kích thước **`96 x 68 pt`**, bo góc `20pt`.
  - Khoảng cách kéo thả thẳng đứng: ~85–95pt (vừa vặn sải tay ngón trỏ của trẻ).
* **Vị trí Nami:** Nami đứng nép ở góc trái dưới cùng (chiều cao ~130pt), chân chạm thảm cỏ, hoàn toàn nằm ngoài bounding box kéo thả.

---

## 5. Landscape Tablet / iPad Layout (Máy Tính Bảng Màn Hình Ngang)

Áp dụng cho iPad (tỷ lệ 4:3, 10.2", 11", 12.9") và Android Tablet (16:10):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  ( < ) 52pt                                                                ( 🔊 ) 52pt │
│                                                                                        │
│                      [   DÃY CHỮ MỤC TIÊU (Sequence Board)   ]                         │
│                      [  A  ]    [  ?  ]    [  C  ]    [  ?  ]    [  E  ]               │
│                      (Mỗi ô: 104x104pt, bo góc 26pt, bóng đổ 3D sâu)                   │
│                                                                                        │
│                               (✓ Con làm đúng rồi — 44pt)                              │
│                                                                                        │
│                      [   KHAY CHỮ CÁI (Tactile Letter Tray)   ]                        │
│                      [   B   ]              [   D   ]              [💡]   [🔄]         │
│                      (Mỗi thẻ: 120x90pt, chữ 3D siêu lớn xúc giác)                     │
│                                                                                        │
│   [Gấu Nami đứng vẫy tay]                                    [Tê giác Niko nhảy múa]   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

* **Không gian rộng mở:** Tận dụng chiều cao khoáng đạt (768–1024pt) để nâng tầm thị giác thành một cuốn **sách tranh 3D tương tác (Interactive 3D Pop-up Storybook)**.
* **Kích thước siêu lớn cho ngón tay trẻ:**
  - Ô mục tiêu: Kích thước **`104 x 104 pt`**, bo góc `26pt`, viền đậm nét.
  - Thẻ chữ kéo thả: Kích thước **`120 x 90 pt`**, cỡ chữ 3D cao 36pt.
* **Sự hiện diện của nhân vật:** Cả hai bạn Nami (bên trái) và Niko (bên phải) đều có mặt trên đồng cỏ hoa, tạo không khí lớp học vui nhộn, ấm áp.

---

## 6. S03 Specification (Instruction Screen)

* **Mục tiêu:** Giới thiệu trực quan luật chơi mà không làm trẻ phải đọc nhiều chữ.
* **Bố cục ngang:**
  1. **Nền:** Bầu trời trong xanh, đồi cỏ hoa dại nắng ấm theo đúng phong cách ảnh portrait đã duyệt.
  2. **Card trung tâm:** Thẻ trắng bo góc lớn (`borderRadius: 28pt`, nền `#FFFFFF`, viền mỏng), hiển thị dãy chữ mẫu:
     `[ A ]   [ ? ]   [ C ]   [ ? ]   [ E ]`
  3. **Linh vật hướng dẫn:** Gấu Nami đứng cạnh thẻ trắng bên phải, một tay chỉ vào ô `?` để làm mẫu hành động cần làm.
  4. **Nút âm thanh:** Nút tròn `🔊` đặt ở góc trên bên phải màn hình. Bấm vào sẽ phát giọng nói ấm áp: *"Bé hãy nhìn dãy chữ và đặt chữ còn thiếu vào ô trống nhé!"*.
  5. **Nút Bắt đầu:** Nút viên thuốc xanh dương NamyKids cỡ lớn (`minHeight: 54pt`, `paddingHorizontal: 36pt`, `borderRadius: 999`) đặt nổi bật ở đáy trung tâm: `"Bắt đầu"`.

---

## 7. S04 Specification (Active Learning — Drag & Drop)

* **Mục tiêu:** Trải nghiệm chơi chính — rộng rãi, không vướng víu, phản hồi tức thì.
* **Bố cục ngang:**
  1. **Dãy mục tiêu (Target Sequence):** Đặt ở nửa trên trung tâm. Các chữ đã có (A, C, E) là các thẻ trắng nổi chữ 3D rực rỡ; các ô khuyết là thẻ viền nét đứt mang dấu `?`.
  2. **Khay chứa chữ (Tray):** Đặt ở nửa dưới trung tâm. Thẻ chữ nổi khối dày dặn, bóng đổ mềm mại, màu sắc bắt mắt.
  3. **Tương tác kéo thả mượt mà:**
     - Chạm vào thẻ -> Thẻ phóng to nhẹ (`scale: 1.08`), nhấc lên khỏi mặt phẳng (`zIndex: 10`).
     - Kéo lên ô trống -> Ô trống sáng đèn viền xanh đón nhận.
     - Thả tay đúng -> Thẻ khóa khít vào ô, phát tiếng chuông vui tai và hiện bubble: `"✓ Con làm đúng rồi"`.
     - Thả tay sai -> Thẻ tự động trượt êm ái về vị trí cũ bằng lò xo `withSpring(0)`, hiện bubble: `"↩ Con thử lại nhé"`.
  4. **Chế độ chạm-chọn thay thế (select_then_place):** Chạm thẻ chữ (thẻ nhấc lên 4pt và sáng viền xanh), sau đó chạm ô trống -> thẻ tự động bay vào ô trống.
  5. **Nút phụ trợ bên phải khay:**
     - Nút `"Gợi ý"`: Icon bóng đèn 💡 tròn nhỏ (`42x42pt`), mờ khi chưa đủ điều kiện, sáng khi đã có 1 lần đặt sai.
     - Nút `"Lượt mới"`: Icon xoay tròn 🔄 nhỏ (`42x42pt`), mờ đi sau khi trẻ đã đặt chữ đầu tiên.

---

## 8. S07 Specification (Completion Screen)

* **Mục tiêu:** Tôn vinh nỗ lực của bé một cách trọn vẹn, ấm áp, đậm chất hoạt hình NamyKids.
* **Bố cục ngang:**
  1. **Khung cảnh ăn mừng:** Cầu vồng rực rỡ vắt ngang qua bầu trời, mưa hoa giấy và các ngôi sao vàng 3D lấp lánh rơi chầm chậm.
  2. **Nhân vật:** Cả Nami và Niko đứng ở trung tâm nhảy múa reo vui, giơ hai tay ăn mừng cùng bé.
  3. **Tiêu đề chúc mừng:** Dòng chữ lớn rực rỡ uốn lượn: `"Chúc mừng con!"` (Typography bo tròn, màu xanh chàm viền sáng).
  4. **Đúng 2 nút bấm đồ chơi đặt song song:**
     - Nút chính (bên phải): `"Chơi mới"` (Viên thuốc xanh dương NamyKids rực rỡ, chữ trắng đậm).
     - Nút phụ (bên trái): `"Chơi lại"` (Viên thuốc màu kem viền mỏng êm dịu, chữ xanh chàm).
  5. **Tuyệt đối không có:** Điểm số phức tạp, bảng xếp hạng, hay nhãn thành thạo (mastery) gây áp lực.

---

## 9. Speaker-Icon Specification (Nút Âm Thanh Nhỏ Gọn)

* **Thay thế hoàn toàn:** Thanh chữ ngang dài cồng kềnh *"Nghe lại hướng dẫn"* bị loại bỏ 100%.
* **Đặc tả nút âm thanh mới:**
  - **Hình dáng:** Hình tròn hoàn hảo (`width: 44pt`, `height: 44pt`, `borderRadius: 22pt` trên phone; `48x48pt` trên tablet).
  - **Màu sắc & Chất liệu:** Nền thẻ trắng tinh khôi (`#FFFFFF`), viền mỏng (`#20108022`), đổ bóng mềm 3D (`elevation: 3`).
  - **Biểu tượng:** Icon loa phát thanh 🔊 phong cách đồ chơi mộc mạc màu xanh chàm (`namyColors.brand.primary` / `#201080`) hoặc xanh dương tươi.
  - **Vị trí cố định:** Góc trên bên phải màn hình (`top: insets.top + 8pt`, `right: insets.right + 16pt`).
  - **Hiệu ứng xúc giác:** Nhấn xuống co nhẹ (`scale: 0.92`), nhả tay nảy lại lò xo `1.0`.
  - **Nhãn trợ năng (VoiceOver / TalkBack):**
    - `accessibilityRole="button"`
    - `accessibilityLabel="Nghe lại hướng dẫn"`
    - `accessibilityHint="Phát lại giọng đọc hướng dẫn của bài học"`

---

## 10. Component Preservation Rules (Những Gì Bắt Buộc Giữ Nguyên)

Để bảo đảm màn hình landscape nhìn vào là nhận ra ngay **100% NamyKids nguyên bản**, Codex bắt buộc phải giữ nguyên vẹn các thành phần sau:

1. **CTA Nút Viên Thuốc Xanh Dương:** Nút chính luôn dùng kiểu dáng viên thuốc (`borderRadius: 999`), chiều cao chuẩn `52–54pt`, màu xanh dương thương hiệu NamyKids (`namyColors.brand.primary`), chữ trắng đậm nét.
2. **Thẻ Trắng Bo Tròn Đồ Chơi:** Mọi card bài tập, ô chữ, khung hiển thị đều giữ màu nền trắng `#FFFFFF`, góc bo cực lớn (20–28pt) và đổ bóng mềm.
3. **Màu Sắc Chữ Cái 3D:** Chữ cái luôn dùng bảng màu tươi sáng thân thiện của NamyKids (Đỏ tươi, Xanh dương đậm, Vàng mật ong, Xanh lá tươi, Tím pastel).
4. **Nhận Diện Nhân Vật Nami & Niko:** Giữ nguyên 100% trang phục, tỷ lệ đầu thân hoạt hình, màu lông nâu ấm của Nami và màu da tím của Niko từ ảnh portrait đã duyệt.
5. **Bảng Màu Nền Bầu Trời & Đồi Cỏ:** Nền trời pastel `#E0F0FF` và đồi cỏ xanh ngọc dịu mát.

---

## 11. Responsive Spacing Rules (Quy Chuẩn Khoảng Cách Đa Màn Hình)

| Thông Số Thiết Kế | Phone Landscape Nhỏ (< 750pt) | Phone Landscape Chuẩn (750–932pt) | Tablet / iPad (1024–1366pt) |
|---|---|---|---|
| **Padding ngang hai bên** | `insets.left + 16pt` | `insets.left + 24pt` | `insets.left + 48pt` |
| **Kích thước Ô mục tiêu (Drop target)** | `68 x 68 pt` (radius 18pt) | `76 x 76 pt` (radius 20pt) | `104 x 104 pt` (radius 26pt) |
| **Khoảng cách giữa các ô mục tiêu** | `8 pt` | `10 pt` | `14 pt` |
| **Kích thước Thẻ khay chữ (Tray tile)** | `88 x 62 pt` (radius 18pt) | `96 x 68 pt` (radius 20pt) | `120 x 90 pt` (radius 24pt) |
| **Khoảng cách giữa các thẻ khay** | `12 pt` | `16 pt` | `24 pt` |
| **Khoảng cách kéo thả thẳng đứng** | `~80 pt` | `~90 pt` | `~120 pt` |
| **Đường kính nút Loa & Quay lại** | `42 pt` | `44 pt` | `50 pt` |
| **Chiều cao nút CTA chính** | `48 pt` | `52 pt` | `56 pt` |

---

## 12. Codex Implementation Boundaries (Phân Định Ranh Giới Kỹ Thuật)

### A. Tệp Codex ĐƯỢC PHÉP CHỈNH SỬA (MAY TOUCH)
1. `src/dev/FoundationPreview.tsx` (Chuyển đổi container bài học sang bố cục landscape, tích hợp nút loa tròn, bố trí lại S03/S04/S07 theo luồng ngang).
2. `src/ui/NamyScene.tsx` (Bổ sung cờ `landscape?: boolean` để điều chỉnh container, safe area insets ngang và ẩn bớt header dọc khi ở chế độ bài học).
3. `src/ui/brand-tokens.ts` & `src/ui/typography.ts` (Sử dụng đúng token chuẩn, bổ sung kích thước chữ responsive nếu cần).
4. `src/runtime/activity-player/ActivityPlayer.tsx` & `src/runtime/activity-player/presentation.ts` (Điều chỉnh layout ngang tương ứng cho production player khi nghiệm thu).
5. Các file test UI/presentation liên quan trong `tests/`.

### B. Tệp Codex TUYỆT ĐỐI CẤM CHẠM (MUST NOT TOUCH)
1. `src/runtime/game-session/reducer.ts` và `contracts.ts` (Toàn bộ state machine và phase transition).
2. `src/engines/e02-drag-drop/contracts.ts` (Logic đánh giá thả chữ, chọn vị trí khuyết `selectRefreshPositions`).
3. `src/runtime/activity-player/round-assessment.ts` (Thuật toán ghi nhận năng lực độc lập, thử-sai, có hỗ trợ).
4. `src/runtime/activity-player/completion-orchestrator.ts` và `session-snapshot.ts`.
5. `src/runtime/runtime-bootstrap.ts` và `RuntimeBootstrapProvider.tsx`.
6. Toàn bộ `src/auth/`, `src/data/`, `src/persistence/`, `src/sync/`, và `supabase/`.

---

## 13. User Visual Acceptance Checklist (Danh Mục Nghiệm Thu Thị Giác)

Khi Codex hoàn thành đợt triển khai, User và CMO sẽ đánh giá chất lượng thích ứng dựa trên bảng kiểm tra 10 điểm sau:

- [ ] **1. Giữ trọn vẹn phong cách NamyKids portrait đã duyệt:** Màn hình ngang trông như cùng một ứng dụng với bản portrait gốc (cùng màu sắc, cùng kiểu thẻ trắng bo tròn, cùng nút xanh dương, cùng nhân vật 3D Soft CGI).
- [ ] **2. Không tự sáng tác concept mới:** Không có biển bảng gỗ mộc mạc kiểu nông trại, không có kết cấu thô kệch lạ lẫm.
- [ ] **3. Bố cục ngang rộng rãi, khoáng đạt:** Bảng chữ cái và khay chữ trải rộng theo chiều ngang, giải phóng hoàn toàn cảm giác chật chội.
- [ ] **4. Nút âm thanh tròn nhỏ gọn 🔊:** Thanh ngang dài "Nghe lại hướng dẫn" đã biến mất hoàn toàn, thay bằng nút tròn xinh xắn ở góc trên bên phải.
- [ ] **5. Thao tác kéo thả công thái học:** Khay chữ ở dưới, ô trống ở trên, bé kéo thẳng đứng từ dưới lên dễ dàng mà không bị tay che khuất bài học.
- [ ] **6. Vùng chạm lớn cho trẻ em:** Ô mục tiêu và thẻ chữ đạt kích thước vượt chuẩn trợ năng (tối thiểu 76pt trên phone, 104pt trên iPad).
- [ ] **7. Micro-feedback nhẹ nhàng, không chặn:** `"✓ Con làm đúng rồi"` và `"↩ Con thử lại nhé"` xuất hiện dưới dạng bong bóng nổi tinh tế và tự trôi đi.
- [ ] **8. S07 Hoàn thành đúng chuẩn:** Chỉ có tiêu đề `"Chúc mừng con!"` cùng 2 nút lớn `"Chơi mới"` và `"Chơi lại"`, không nhồi nhét điểm số hay sao kinh tế.
- [ ] **9. Hiển thị hoàn hảo trên cả Phone và iPad:** Không bị tràn viền, tôn trọng vùng an toàn (Safe Area) tránh tai thỏ.
- [ ] **10. Toàn bộ invariants được bảo toàn 100%:** Mọi bài test kiểm thử logic, reducer, typecheck, lint, build web đều đạt kết quả PASS hoàn hảo.

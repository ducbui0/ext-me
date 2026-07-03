# Tomato Novel Sync (VBook Extension)

Extension hỗ trợ đồng bộ và đọc truyện đã tải bằng **Tomato Novel Downloader** từ máy tính của bạn qua kết nối Wi-Fi.

## Tính năng chính
- **Thư viện đã tải:** Đồng bộ danh sách truyện từ PC sang điện thoại.
- **Tải tự động:** Nếu truyện chưa được tải trên PC, extension sẽ gửi lệnh kích hoạt tiến trình tải xuống trên máy tính.
- **Đọc Offline & Cache tối ưu:** Sử dụng cache thông minh lưu trữ nội dung chương qua file văn bản `.txt` hoặc tệp `status.json` để tăng tốc độ load trang và giảm băng thông.
- **Đồng bộ tự động thông tin chi tiết:** Số chương, tác giả, mô tả truyện, điểm số... được lấy trực tiếp từ máy chủ local.

## Hướng dẫn cài đặt và sử dụng

### Bước 1: Khởi động Máy chủ Tomato Novel Downloader trên PC
Đảm bảo bạn đã mở ứng dụng máy chủ Tomato Novel Downloader trên máy tính. Cổng mặc định hoạt động là `18423`.

### Bước 2: Kết nối cùng mạng Wi-Fi
Điện thoại và máy tính của bạn phải được kết nối vào **cùng một mạng Wi-Fi (LAN)**.

### Bước 3: Cài đặt extension trong ứng dụng VBook
1. Tải file `plugin.json` hoặc cài đặt từ liên kết zip.
2. Thiết lập địa chỉ IP của máy tính trong phần cài đặt của extension (phần cấu hình nguồn/máy chủ) thay thế cho URL mặc định. Ví dụ: `http://192.168.1.15:18423` (trong đó `192.168.1.15` là IP máy tính của bạn).

---
*Lưu ý: Tùy thuộc vào cài đặt mạng hoặc tường lửa trên PC, bạn có thể cần cho phép cổng `18423` giao tiếp qua mạng nội bộ.*

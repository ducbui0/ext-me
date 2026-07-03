# Tomato Novel Sync (VBook Extension) - Ngrok Edition

Extension hỗ trợ đồng bộ và đọc truyện đã tải bằng **Tomato Novel Downloader** từ máy tính của bạn qua kết nối internet (4G/Wi-Fi từ xa) bằng giải pháp bảo mật và **không bị đổi liên kết (cố định vĩnh viễn)** khi khởi động lại máy.

---

## 🛠️ Cơ chế hoạt động
1. **HTTP Server (Python)**: Chạy máy chủ trung gian qua tệp `vbook_server.py` tại cổng `18423`.
2. **Đường hầm Ngrok (Static Domain)**: Sử dụng tên miền cố định miễn phí của ngrok (dạng `xxxx.ngrok-free.dev`) để tạo một liên kết HTTPS bảo mật vĩnh viễn trỏ về cổng `18423` của máy tính.
3. **Ứng dụng VBook**: Kết nối qua URL cố định này để đồng bộ danh sách, thông tin chi tiết và tải chương truyện từ máy tính của bạn từ bất kỳ đâu.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT TRÊN MÁY TÍNH MỚI (Từ A đến Z)

Nếu bạn muốn chuyển toàn bộ hệ thống này sang một máy tính mới, hãy làm theo các bước sau:

### Bước 1: Sao chép các tệp cần thiết sang máy mới
Sao chép toàn bộ thư mục chứa các file sau sang máy mới:
* `TomatoNovelDownloader-Win64-v2.4.13.exe` (Trình tải truyện chính)
* `config.yml` (File cấu hình)
* `vbook_server.py` (Mã nguồn máy chủ trung gian Python)
* `run_with_ngrok.bat` (File kích hoạt tự động)

### Bước 2: Cài đặt Python 3 (Bằng 1 dòng lệnh)
Mở **PowerShell** trên máy tính mới và dán dòng lệnh sau để tự động tải và cài đặt Python âm thầm:
```powershell
Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.10.11/python-3.10.11-amd64.exe" -OutFile "python_installer.exe"; Start-Process -FilePath ".\python_installer.exe" -ArgumentList "/quiet InstallAllUsers=0 PrependPath=1" -Wait; Remove-Item -Path "python_installer.exe" -Force
```
*(Hoặc bạn có thể cài đặt Python 3.10+ thủ công từ trang chủ, hãy nhớ tích chọn **"Add Python to PATH"** khi cài).*

### Bước 3: Cài đặt ngrok (Bằng 1 dòng lệnh)
Mở **PowerShell** trong thư mục chứa dự án trên máy tính mới và chạy dòng lệnh sau để tự động tải và giải nén `ngrok.exe`:
```powershell
Invoke-WebRequest -Uri "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip" -OutFile "ngrok.zip"; Expand-Archive -Path "ngrok.zip" -DestinationPath "." -Force; Remove-Item -Path "ngrok.zip" -Force
```
*(Sau lệnh này, file `ngrok.exe` sẽ xuất hiện trong thư mục dự án trên máy tính mới).*

### Bước 4: Chạy cấu hình lần đầu
1. Nhấp đúp chuột chạy file **`run_with_ngrok.bat`**.
2. Chương trình sẽ yêu cầu bạn nhập Token (chỉ hỏi 1 lần duy nhất):
   `Token cua ban: `
3. Hãy truy cập [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken) để lấy mã Authtoken của bạn, dán vào cửa sổ và nhấn **Enter**.
4. Máy chủ Python và đường hầm ngrok sẽ tự động kết nối và chạy chung trong 1 cửa sổ duy nhất.

### Bước 5: Thiết lập trên điện thoại (VBook)
Điền dòng mã sau vào phần **Mã bổ sung (Additional Code)** của extension Tomato trên VBook một lần duy nhất:
```javascript
var CONFIG_URL = "https://opt-cartel-ominous.ngrok-free.dev";
```
*(Đường dẫn này là cố định vĩnh viễn, bạn không cần phải đổi lại nữa).*

---

## 🔄 Tự động chạy khi bật máy tính
Nếu muốn máy tính tự động khởi động máy chủ ngầm mỗi khi bật máy:
1. Nhấn tổ hợp phím `Windows + R`, gõ vào `shell:startup` và nhấn **Enter**.
2. Nhấp chuột phải vào file `run_with_ngrok.bat` -> Chọn **Create Shortcut** (Tạo lối tắt).
3. Di chuyển file Shortcut vừa tạo và thả vào thư mục `Startup` vừa hiện ra.

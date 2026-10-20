# AI Video Studio — MVP miễn phí

Bản MVP website dùng HTML/CSS/JavaScript, chạy trên trình duyệt. Không cần API trả phí.

## Chức năng hiện có
- Nhập và sửa kịch bản.
- Chọn ngôn ngữ giọng đọc để nghe thử bằng SpeechSynthesis của trình duyệt.
- Tải ảnh hoặc clip có sẵn.
- Tải tệp giọng đọc có sẵn (WAV/MP3/M4A).
- Ghép hình ảnh/clip với âm thanh.
- Vẽ phụ đề từ kịch bản lên video.
- Chọn tỷ lệ 16:9, 9:16 hoặc 1:1.
- Xuất video WebM từ trình duyệt.

## Giới hạn quan trọng
- Không tự sinh video AI từ văn bản.
- Không tự tạo tệp giọng đọc tải xuống; giọng đọc trình duyệt chỉ để nghe thử. Muốn xuất video có âm thanh, cần tải lên tệp giọng đọc đã tạo.
- Chưa có đồng bộ khẩu hình thật cho avatar.
- Xuất WebM, không xuất MP4 trực tiếp.
- Phụ đề hiện là một lớp văn bản tĩnh lấy từ toàn bộ kịch bản, chưa đồng bộ từng từ/câu theo thời gian.
- Khả năng phát/ghi phụ thuộc trình duyệt. Chrome hoặc Edge phiên bản mới được khuyến nghị.

## Cách chạy đơn giản
1. Giải nén ZIP.
2. Mở thư mục `ai-video-studio-mvp`.
3. Nhấp đúp `index.html` để mở bằng Chrome hoặc Edge.
4. Nhập kịch bản.
5. Tải ảnh hoặc video.
6. Tải tệp giọng đọc (WAV/MP3/M4A).
7. Nhấn **Dựng video**.
8. Nhấn **Tải video .WEBM** khi hoàn tất.

Nếu trình duyệt chặn một tính năng khi mở file trực tiếp, hãy chạy máy chủ cục bộ:
- Cài Python nếu máy chưa có.
- Mở Terminal/Command Prompt tại thư mục dự án.
- Chạy `python -m http.server 8000`
- Mở `http://localhost:8000`

## Chuyển WebM sang MP4 miễn phí bằng FFmpeg
Sau khi cài FFmpeg, chạy lệnh:
```bash
ffmpeg -i ai-video-studio.webm -c:v libx264 -pix_fmt yuv420p -c:a aac ai-video-studio.mp4
```

## Cấu trúc
- `index.html` — giao diện.
- `style.css` — thiết kế.
- `app.js` — xử lý tải media, phụ đề và ghi video.

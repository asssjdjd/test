hướng dẫn chạy 
1. (server)  chạy server => localhost:3001
tiếp theo phải chạy ngrok ở port đó với lệnh ngrok http 3001 để deploy tạm thời port đó để làm server

2.(host) : máy bị điều khiển
tiếp theo run : npm start => chạy logic cổng host

3.(client) : máy điều khiển
cuois cùng sang một máy khác chạy file index.html -> để kết nối hai máy

lỗi ở đây là việc không gửi được video từ máy host sang cho client.
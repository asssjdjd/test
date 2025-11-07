
const {mouse, keyboard, screen, Button, Point} =  require("@nut-tree-fork/nut-js");

mouse.config.autoDelayMs = 0;
keyboard.config.autoDelayMs = 0;
screen.config.autoDelayMs = 0;

async function handleEvent(type, data) {
    // Normalize incoming type names (client may send 'mousemove')
    if (type === 'mousemove') type = 'move';
    console.log(`Event Type: ${type}`, data);

    switch (type) {
        case 'move':
            // nut-js expects a Point (and returns a Promise)
            await mouse.setPosition(new Point(data.x, data.y));
            break;
        case 'down':
            const btnDown = data.button === 'left' ? Button.LEFT : 
                           data.button === 'right' ? Button.RIGHT : Button.MIDDLE;
            await mouse.pressButton(btnDown);
            break;
        case 'up':
            const btnUp = data.button === 'left' ? Button.LEFT : 
                         data.button === 'right' ? Button.RIGHT : Button.MIDDLE;
            await mouse.releaseButton(btnUp);
            break;
        case 'scroll':
            // client sends deltaY; convert to an amount nut-js expects
            await mouse.scrollDown(Math.abs(data.deltaY || data.y) / 100);
            break;
        case 'keydown':
            await keyboard.pressKey(data.code || data.key);
            break;
        case 'keyup':
            await keyboard.releaseKey(data.code || data.key);
            break;
        case 'click':
            const btnClick = data.button === 'left' ? Button.LEFT : 
                             data.button === 'right' ? Button.RIGHT : Button.MIDDLE;
            await mouse.click(btnClick);
            break;
    }
}

module.exports = { handleEvent };


/* lưu ý : phải test trước như các hàm chuẩn bị sau : */

// handleEvent('mouseMove', { x: 100, y: 150 });
// handleEvent('mouseClick', { button: 'left' });

/* ............................................................................ */

/* Xử lý thêm các sự kiện khác tại đây */

// Position move

// Left click (down, up)

// Right click (down, up)

// Double click

// Middle click

// Scroll wheel

// Drag & drop (mousedown + move + mouseup)

// xử lý thêm các tổ hợp phím tắt cho phép cap màn hình, hay cho phép mở record, ctrl +C , ctrl + V ...

// xử lý thêm sự kiện người dùng nhập text sao cho hiểu khi nào họ nhập text 


// Xử lý batch events ( một mảng các sự kiện cho việc tối ưu độ trễ ứng dụng)
function handleBatch(batch) {
    for (const event of batch) {
        handleEvent(event.type, event);
    }
}

module.exports = { handleEvent, handleBatch };
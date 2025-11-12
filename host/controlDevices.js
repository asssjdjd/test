
const {mouse, keyboard, screen, Button, Point, Key} =  require("@nut-tree-fork/nut-js");

mouse.config.autoDelayMs = 0;
keyboard.config.autoDelayMs = 0;
screen.config.autoDelayMs = 0;

// Map common string names to nut-js Key enum values. Returns null if unknown.
function mapToKeyEnum(keyStr) {
    if (!keyStr) return null;
    const normalized = String(keyStr).replace(/^Key/i, '').toUpperCase();

    const nameMap = {
        'ENTER': Key.Enter,
        'BACKSPACE': Key.Backspace,
        'TAB': Key.Tab,
        'ESC': Key.Escape,
        'ESCAPE': Key.Escape,
        'ARROWUP': Key.ArrowUp,
        'ARROWDOWN': Key.ArrowDown,
        'ARROWLEFT': Key.ArrowLeft,
        'ARROWRIGHT': Key.ArrowRight,
        'CONTROL': Key.LeftControl || Key.Control,
        'CTRL': Key.LeftControl || Key.Control,
        'SHIFT': Key.LeftShift || Key.Shift,
        'ALT': Key.LeftAlt || Key.Alt,
        'META': Key.MetaLeft || Key.Meta,
        'LEFT': Key.ArrowLeft,
        'RIGHT': Key.ArrowRight,
        'UP': Key.ArrowUp,
        'DOWN': Key.ArrowDown,
    };

    if (nameMap[normalized]) return nameMap[normalized];
    if (Key[normalized]) return Key[normalized];
    return null;
}

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
        case 'keydown': {
            // Either a printable character or a named key (Enter, ArrowUp, etc.)
            const keyOrCode = data.key || data.code;

            // If it's a single printable character, use keyboard.type()
            if (typeof keyOrCode === 'string' && keyOrCode.length === 1) {
                // keyboard.type will emit press+release for the character
                await keyboard.type(keyOrCode);
                console.log('Typed character via keyboard.type:', keyOrCode);
                break;
            }

            // Map common names to Key enum values (fall back to Key[...] if available)
            const mapped = mapToKeyEnum(keyOrCode);
            if (mapped) {
                await keyboard.pressKey(mapped);
            } else {
                console.warn('Unknown key for press:', keyOrCode);
            }
            break;
        }
        case 'keyup': {
            const keyOrCode = data.key || data.code;
            // For printable characters we used keyboard.type() (already pressed+released),
            // so there's nothing to release here; only try release for mapped Keys.
            const mapped = mapToKeyEnum(keyOrCode);
            if (mapped) {
                await keyboard.releaseKey(mapped);
            } else {
                console.log('No release action for printable/unknown key:', keyOrCode);
            }
            break;
        }
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
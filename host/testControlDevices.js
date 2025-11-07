
const { handleEvent } = require('./controlDevices.js');

// test api controll devices
function testHandleEvent() {
    // Test mouse move event
    handleEvent('move', { x: 100, y: 150 });
    // Test mouse click event
    handleEvent('click', { button: 'left' });

}
testHandleEvent();


// 對應 ESP32 程式碼中的 UUID
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');
const sendButton = document.getElementById('sendButton');
const textInput = document.getElementById('textInput');
const statusDiv = document.getElementById('status');
const controlsDiv = document.getElementById('controls');

let esp32Characteristic;
let bleDevice; // 用來儲存連線的裝置物件

// --- 頁面載入時進行功能檢測 ---
window.addEventListener('load', () => {
    if ('bluetooth' in navigator) {
        connectButton.disabled = false;
        statusDiv.textContent = '您的瀏覽器支援 Web Bluetooth，請點擊按鈕連線。';
    } else {
        connectButton.disabled = true;
        statusDiv.innerHTML = '<strong>錯誤：</strong>您的瀏覽器或設備不支援 Web Bluetooth。<br>請在 Android 手機或桌上型電腦上，使用最新版的 Chrome 或 Edge 瀏覽器開啟此頁面。';
        console.warn('Web Bluetooth API not supported on this browser.');
    }
});

// --- 新增: 處理中斷連線的 UI 更新 ---
function onDisconnected() {
    statusDiv.textContent = '狀態：已中斷連線';
    connectButton.style.display = 'inline-block';
    controlsDiv.style.display = 'none';
    disconnectButton.style.display = 'none'; // 確保中斷按鈕也隱藏
}

// 連線按鈕的點擊事件
connectButton.addEventListener('click', async () => {
    try {
        statusDiv.textContent = '正在掃描設備...';
        
        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE_UUID] }]
        });
        
        // --- 新增: 監聽裝置的中斷連線事件 ---
        bleDevice.addEventListener('gattserverdisconnected', onDisconnected);

        statusDiv.textContent = '正在連線到 ' + bleDevice.name + '...';
        const server = await bleDevice.gatt.connect();
        
        statusDiv.textContent = '正在取得服務...';
        const service = await server.getPrimaryService(SERVICE_UUID);
        
        statusDiv.textContent = '正在取得特徵...';
        esp32Characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

        statusDiv.textContent = '連線成功！';
        connectButton.style.display = 'none';
        controlsDiv.style.display = 'block';
        
    } catch (error) {
        statusDiv.textContent = '錯誤: ' + error;
        console.error(error);
        if (bleDevice) {
            bleDevice.removeEventListener('gattserverdisconnected', onDisconnected);
        }
    }
});

// --- 新增: 中斷連線按鈕的點擊事件 ---
disconnectButton.addEventListener('click', async () => {
    if (!bleDevice || !bleDevice.gatt.connected) {
        alert('尚未連線或已中斷');
        return;
    }
    try {
        statusDiv.textContent = '正在中斷連線...';
        await bleDevice.gatt.disconnect();
    } catch (error) {
        statusDiv.textContent = '中斷連線失敗: ' + error;
        console.error(error);
    }
});


// 傳送按鈕的點擊事件
sendButton.addEventListener('click', async () => {
    if (!esp32Characteristic) {
        alert('尚未連線到 ESP32');
        return;
    }

    const text = textInput.value;
    if (text === '') {
        alert('請輸入文字');
        return;
    }

    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        
        await esp32Characteristic.writeValue(data);
        
        statusDiv.textContent = '已傳送: ' + text;

    } catch (error) {
        statusDiv.textContent = '傳送失敗: ' + error;
        console.error(error);
    }
});

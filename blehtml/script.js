// 對應 ESP32 程式碼中的 UUID
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

const connectButton = document.getElementById('connectButton');
const sendButton = document.getElementById('sendButton');
const textInput = document.getElementById('textInput');
const statusDiv = document.getElementById('status');
const controlsDiv = document.getElementById('controls');

let esp32Characteristic; // 用來儲存 BLE 特徵物件

// --- 新增：頁面載入時進行功能檢測 ---
window.addEventListener('load', () => {
    if ('bluetooth' in navigator) {
        // 如果 navigator 物件中有 'bluetooth'，表示瀏覽器支援
        connectButton.disabled = false;
        statusDiv.textContent = '您的瀏覽-器支援 Web Bluetooth，請點擊按鈕連線。';
    } else {
        // 如果不支援，則禁用按鈕並顯示提示訊息
        connectButton.disabled = true;
        statusDiv.innerHTML = '<strong>錯誤：</strong>您的瀏覽器或設備不支援 Web Bluetooth。<br>請在 Android 手機或桌上型電腦上，使用最新版的 Chrome 或 Edge 瀏覽器開啟此頁面。';
        console.warn('Web Bluetooth API not supported on this browser.');
    }
});

// 連線按鈕的點擊事件
connectButton.addEventListener('click', async () => {
    try {
        statusDiv.textContent = '正在掃描設備...';
        
        // 請求 BLE 設備，並只篩選出有我們定義的 Service UUID 的設備
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE_UUID] }]
        });
        
        statusDiv.textContent = '正在連線到 ' + device.name + '...';
        const server = await device.gatt.connect();
        
        statusDiv.textContent = '正在取得服務...';
        const service = await server.getPrimaryService(SERVICE_UUID);
        
        statusDiv.textContent = '正在取得特徵...';
        esp32Characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

        statusDiv.textContent = '連線成功！';
        connectButton.style.display = 'none'; // 隱藏連線按鈕
        controlsDiv.style.display = 'block'; // 顯示控制項
        
    } catch (error) {
        statusDiv.textContent = '錯誤: ' + error;
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
        // Web Bluetooth API 傳送的是位元組(Bytes)，所以需要將字串編碼
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        
        await esp32Characteristic.writeValue(data);
        
        statusDiv.textContent = '已傳送: ' + text;

    } catch (error) {
        statusDiv.textContent = '傳送失敗: ' + error;
        console.error(error);
    }
});
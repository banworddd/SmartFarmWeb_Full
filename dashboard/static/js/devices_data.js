import { showDeviceModal } from './devices_data_modal.js';

document.addEventListener('DOMContentLoaded', () => {
    // =====================
    // Константы и маппинги
    // =====================
    const DEVICE_TYPE_ICONS = {
        sensor: 'fas fa-microchip',
        actuator: 'fas fa-cogs',
        gateway: 'fas fa-network-wired',
        other: 'fas fa-device'
    };

    // --- Маппинг сенсоров ---
    const SENSOR_KEY_DICT = {
        humidity: { label: 'Влажность', unit: '%', icon: 'fa-tint' },
        temperature: { label: 'Температура', unit: '°C', icon: 'fa-thermometer-half' },
        soil_moisture: { label: 'Влажность почвы', unit: '%', icon: 'fa-water' },
        light_intensity: { label: 'Освещённость', unit: 'лк', icon: 'fa-sun' },
        ph_level: { label: 'pH', unit: '', icon: 'fa-vial' },
        battery_level: { label: 'Уровень заряда', unit: '%', icon: 'fa-battery-half' },
        timestamp: { label: 'Время обновления', unit: '', icon: 'fa-clock' },
        cpu_usage: { label: 'Загрузка CPU', unit: '%', icon: 'fa-microchip' },
        memory_usage: { label: 'Использование памяти', unit: '%', icon: 'fa-memory' },
        disk_usage: { label: 'Использование диска', unit: '%', icon: 'fa-hdd' },
        signal_strength: { label: 'Уровень сигнала', unit: 'дБм', icon: 'fa-signal' },
        online: { label: 'Онлайн', unit: '', icon: 'fa-wifi' },
        action: { label: 'Действие', unit: '', icon: 'fa-play' },
        intensity: { label: 'Интенсивность', unit: '%', icon: 'fa-tachometer-alt' },
        duration: { label: 'Длительность', unit: '', icon: 'fa-hourglass-half' }
    };

    // =====================
    // Утилиты
    // =====================
    const getCookie = name => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                return decodeURIComponent(cookie.substring(name.length + 1));
            }
        }
        return null;
    };

    const translateSensorKey = key => SENSOR_KEY_DICT[key]?.label || key;
    const getSensorUnit = key => SENSOR_KEY_DICT[key]?.unit || '';
    const getSensorIcon = key => SENSOR_KEY_DICT[key]?.icon || '';

    const formatSensorValue = value => {
        if (typeof value === 'number') return value.toFixed(2);
        if (typeof value === 'string' && value.match(/^[0-9]+:[0-9]+:[0-9]+$/)) return value;
        if (typeof value === 'string' && ['open', 'close', 'on', 'off', 'start', 'stop'].includes(value.toLowerCase())) {
            return value.charAt(0).toUpperCase() + value.slice(1);
        }
        return value;
    };

    const isValidSensorValue = v => {
        if (typeof v === 'string' && ['open', 'close', 'on', 'off', 'start', 'stop'].includes(v.toLowerCase())) return true;
        if (typeof v === 'string' && v.match(/^[0-9]+:[0-9]+:[0-9]+$/)) return true;
        return v !== null && v !== undefined && v !== '' &&
            !(typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) &&
            !(Array.isArray(v) && v.length === 0);
    };

    const formatDate = dateString => {
        if (!dateString) return '';
        if (dateString.match(/^[0-9]{2}\.[0-9]{2}\.[0-9]{4} [0-9]{2}:[0-9]{2}$/)) return dateString;
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Некорректная дата';
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // =====================
    // Глобальные переменные
    // =====================
    const devicesContainer = document.getElementById('devicesContainer');
    let currentZoneName = null;
    let currentZoneSessionId = null;
    const deviceWebSockets = new Map();

    // =====================
    // WebSocket функции
    // =====================
    const connectToDeviceWebSocket = (deviceId, onDataUpdate, zoneSessionId) => {
        if (deviceWebSockets.has(deviceId)) {
            const wsObj = deviceWebSockets.get(deviceId);
            wsObj._manuallyClosed = true;
            wsObj.ws.close();
            deviceWebSockets.delete(deviceId);
        }
        let currentSensorData = {};
        let currentActuatorData = {};
        let currentDeviceStatus = {};
        let currentOnlineStatus = false;
        const ws = new WebSocket(`ws://${window.location.host}/ws/sensor/${deviceId}/`);
        ws._manuallyClosed = false;
        ws.onopen = () => {};
        ws.onclose = () => {
            if (ws._manuallyClosed) return;
            if (zoneSessionId !== currentZoneSessionId) return;
            updateDeviceOnlineStatus(deviceId, false);
            currentOnlineStatus = false;
            if (onDataUpdate) onDataUpdate(currentSensorData, currentActuatorData, currentDeviceStatus, currentOnlineStatus);
            setTimeout(() => connectToDeviceWebSocket(deviceId, onDataUpdate, zoneSessionId), 5000);
        };
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch(data.type) {
                case 'send_sensor_data':
                    updateDeviceSensorData(deviceId, data.data);
                    currentSensorData = data.data;
                    if (onDataUpdate) onDataUpdate(currentSensorData, currentActuatorData, currentDeviceStatus, currentOnlineStatus);
                    {
                        const wsObj = deviceWebSockets.get(deviceId);
                        if (wsObj && wsObj.updateCallback) wsObj.updateCallback(currentSensorData, currentActuatorData, currentDeviceStatus, currentOnlineStatus);
                    }
                    break;
                case 'send_actuator_data':
                    const actuatorData = {
                        action: data.data.action,
                        intensity: data.data.intensity,
                        duration: data.data.duration,
                        timestamp: data.data.timestamp
                    };
                    updateDeviceSensorData(deviceId, actuatorData);
                    currentActuatorData = actuatorData;
                    if (onDataUpdate) onDataUpdate(currentSensorData, currentActuatorData, currentDeviceStatus, currentOnlineStatus);
                    {
                        const wsObj = deviceWebSockets.get(deviceId);
                        if (wsObj && wsObj.updateCallback) wsObj.updateCallback(currentSensorData, currentActuatorData, currentDeviceStatus, currentOnlineStatus);
                    }
                    break;
                case 'device_status_data':
                    if (typeof data.data.online !== 'undefined') {
                        updateDeviceOnlineStatus(deviceId, !!data.data.online);
                        currentOnlineStatus = !!data.data.online;
                        currentDeviceStatus = data.data;
                        if (onDataUpdate) onDataUpdate(currentSensorData, currentActuatorData, currentDeviceStatus, currentOnlineStatus);
                        const wsObj = deviceWebSockets.get(deviceId);
                        if (wsObj && wsObj.updateCallback) wsObj.updateCallback(currentSensorData, currentActuatorData, currentDeviceStatus, currentOnlineStatus);
                    }
                    break;
                default:
                    // игнорируем
            }
        };
        deviceWebSockets.set(deviceId, { ws, _manuallyClosed: false, updateCallback: onDataUpdate });
    };

    const updateDeviceOnlineStatus = (deviceId, isOnline) => {
        const deviceCard = document.querySelector(`[data-device-id="${deviceId}"]`);
        if (!deviceCard) return;
        const status = deviceCard.querySelector('.device-modal-power-btn');
        if (status) {
            status.className = `device-modal-power-btn ${isOnline ? 'online' : 'offline'}`;
            status.title = isOnline ? 'Устройство онлайн' : 'Устройство оффлайн';
        }
    };

    const updateDeviceSensorData = (deviceId, data) => {
        const deviceCard = document.querySelector(`[data-device-id="${deviceId}"]`);
        if (!deviceCard) return;
        const sensorDataBlock = deviceCard.querySelector('.sensor-data');
        if (!sensorDataBlock) return;
        const entries = Object.entries(data || {});
        const validEntries = entries.filter(([_, v]) => isValidSensorValue(v));
        sensorDataBlock.innerHTML = '';
        if (!validEntries.length) {
            if (entries.length) {
                sensorDataBlock.innerHTML = '<div style="color: orange;">DEBUG: ' + JSON.stringify(entries) + '</div>';
            } else {
                sensorDataBlock.innerHTML = '<div style="text-align:center; color:var(--text-color-secondary); opacity:0.8; padding:24px 0;">нет данных с сенсора</div>';
            }
            return;
        }
        const contentContainer = document.createElement('div');
        contentContainer.className = 'sensor-data-content';
        validEntries.forEach(([key, value]) => {
            const item = document.createElement('div');
            item.className = 'sensor-data-item';
            const iconClass = getSensorIcon(key);
            item.innerHTML = `
                <span class="sensor-data-icon"><i class="fas ${iconClass}" style="color: var(--primary-color);"></i></span>
                <span class="sensor-data-label">${translateSensorKey(key)}</span>
                <span class="sensor-data-value">${formatSensorValue(value)} <span style="font-size:0.95em; opacity:0.7; margin-left:4px;">${getSensorUnit(key)}</span></span>
            `;
            contentContainer.appendChild(item);
        });
        sensorDataBlock.appendChild(contentContainer);
    };

    // =====================
    // Создание карточки устройства
    // =====================
    const createDeviceCard = (device) => {
        const card = document.createElement('div');
        card.className = 'device-card';
        card.dataset.deviceId = device.id;

        // --- Заголовок ---
        const header = document.createElement('div');
        header.className = 'device-header';
        const icon = document.createElement('div');
        icon.className = 'device-icon';
        icon.innerHTML = `<i class="${DEVICE_TYPE_ICONS[device.model.device_type] || DEVICE_TYPE_ICONS.other}"></i>`;
        const title = document.createElement('div');
        title.className = 'device-title';
        const name = document.createElement('h3');
        name.className = 'device-name';
        name.textContent = device.name;
        const manufacturer = document.createElement('p');
        manufacturer.className = 'device-manufacturer';
        manufacturer.textContent = device.model.manufacturer;
        title.appendChild(name);
        title.appendChild(manufacturer);
        header.appendChild(icon);
        header.appendChild(title);
        // --- Статус онлайн/оффлайн ---
        const onlineStatus = document.createElement('button');
        onlineStatus.className = 'device-modal-power-btn offline';
        onlineStatus.title = 'Устройство оффлайн';
        onlineStatus.innerHTML = `<i class='fa fa-power-off'></i>`;
        header.appendChild(onlineStatus);
        // --- Блок данных сенсора ---
        const sensorDataContainer = document.createElement('div');
        sensorDataContainer.className = 'sensor-data';
        sensorDataContainer.innerHTML = `<div class="sensor-data-content"></div>`;
        // --- Собираем карточку ---
        card.appendChild(header);
        card.appendChild(sensorDataContainer);
        // --- Для хранения последних данных ---
        let lastSensorData = {};
        let lastActuatorData = {};
        let lastDeviceStatus = {};
        let lastOnlineStatus = false;
        // --- Клик по карточке — открыть модальное окно ---
        card.addEventListener('click', (e) => {
            if (
                !e.target.classList.contains('model-toggle') &&
                !e.target.classList.contains('device-modal-power-btn') &&
                !e.target.closest('.device-modal-power-btn')
            ) {
                showDeviceModal(device, lastSensorData, lastActuatorData, lastDeviceStatus, lastOnlineStatus, (updateCallback) => {
                    const wsUpdateCallback = (sensorData, actuatorData, deviceStatus, onlineStatus) => {
                        lastSensorData = sensorData;
                        lastActuatorData = actuatorData;
                        lastDeviceStatus = deviceStatus;
                        lastOnlineStatus = onlineStatus;
                        updateCallback(sensorData, actuatorData, deviceStatus, onlineStatus);
                    };
                    const wsObj = deviceWebSockets.get(device.id);
                    if (wsObj) wsObj.updateCallback = wsUpdateCallback;
                });
            }
        });
        // --- Подключаемся к WebSocket ---
        connectToDeviceWebSocket(device.id, (sensorData, actuatorData, deviceStatus, onlineStatus) => {
            lastSensorData = sensorData;
            lastActuatorData = actuatorData;
            lastDeviceStatus = deviceStatus;
            lastOnlineStatus = onlineStatus;
        }, currentZoneSessionId);
        return card;
    };

    // =====================
    // Управление WebSocket
    // =====================
    function closeAllDeviceWebSockets() {
        deviceWebSockets.forEach(obj => {
            try { obj._manuallyClosed = true; obj.ws.close(); } catch {}
        });
        deviceWebSockets.clear();
    }

    // =====================
    // Загрузка устройств зоны
    // =====================
    const loadZoneDevices = async (zoneName) => {
        currentZoneSessionId = Date.now();
        closeAllDeviceWebSockets();
        if (devicesContainer) devicesContainer.innerHTML = '';
        await new Promise(r => setTimeout(r, 100));
        try {
            const response = await fetch(`/api/v1/devices/zones_devices/?zone=${zoneName}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Ошибка загрузки устройств');
            const devices = await response.json();
            if (!devices.length) {
                closeAllDeviceWebSockets();
                return;
            }
            if (devicesContainer) {
                closeAllDeviceWebSockets();
                devicesContainer.innerHTML = '';
                await new Promise(r => setTimeout(r, 100));
                devices.forEach(device => {
                    const card = createDeviceCard(device);
                    devicesContainer.appendChild(card);
                });
            }
        } catch (error) {
            console.error('Error:', error);
            closeAllDeviceWebSockets();
            if (devicesContainer) {
                devicesContainer.innerHTML = `
                    <div class="empty-state-container">
                        <div class="error-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <h3>Ошибка загрузки</h3>
                            <p>Не удалось загрузить список устройств</p>
                        </div>
                    </div>
                `;
            }
        }
    };

    // =====================
    // Служебные функции для UI
    // =====================
    const showEmptyDeviceCard = () => {
        closeAllDeviceWebSockets();
        if (devicesContainer) {
            devicesContainer.innerHTML = `
                <div class="device-card empty-device-card">
                    <i class="fas fa-microchip"></i>
                    <div class="main-text">Нет доступных устройств</div>
                    <div class="sub-text">В этой зоне нет устройств</div>
                </div>
            `;
        }
    };

    // =====================
    // Обработчики событий
    // =====================
    document.addEventListener('zoneChanged', (event) => {
        const zoneName = event.detail.name;
        showEmptyDeviceCard();
        if (zoneName) {
            currentZoneName = zoneName;
            loadZoneDevices(zoneName);
        }
    });

    document.addEventListener('orgChanged', () => {
        showEmptyDeviceCard();
        currentZoneName = null;
    });

    document.addEventListener('noFarmsInOrg', () => {
        if (devicesContainer) devicesContainer.innerHTML = '';
        currentZoneName = null;
    });

    // =====================
    // Инициализация
    // =====================
    showEmptyDeviceCard();
});

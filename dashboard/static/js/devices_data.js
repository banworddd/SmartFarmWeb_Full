import { showDeviceModal } from './devices_data_modal.js';

document.addEventListener('DOMContentLoaded', () => {
    // === Константы и сопоставления ===
    const deviceTypeIcons = {
        'sensor': 'fas fa-microchip',
        'actuator': 'fas fa-cogs',
        'gateway': 'fas fa-network-wired',
        'other': 'fas fa-device'
    };

    // === DOM элементы ===
    const devicesContainer = document.getElementById('devicesContainer');
    let currentZoneName = null;
    let currentZoneSessionId = null;
    const deviceWebSockets = new Map();

    // === WebSocket функции ===
    const connectToDeviceWebSocket = (deviceId, onDataUpdate, zoneSessionId) => {
        if (deviceWebSockets.has(deviceId)) {
            const wsObj = deviceWebSockets.get(deviceId);
            wsObj._manuallyClosed = true;
            wsObj.ws.close();
            deviceWebSockets.delete(deviceId);
        }
        let currentSensorData = {};
        let currentOnlineStatus = false;
        const ws = new WebSocket(`ws://${window.location.host}/ws/sensor/${deviceId}/`);
        ws._manuallyClosed = false;
        ws.onopen = () => {
            // ничего не делаем
        };
        ws.onclose = () => {
            if (ws._manuallyClosed) return;
            if (zoneSessionId !== currentZoneSessionId) return;
            updateDeviceOnlineStatus(deviceId, false);
            currentOnlineStatus = false;
            if (onDataUpdate) onDataUpdate(currentSensorData, currentOnlineStatus);
            setTimeout(() => connectToDeviceWebSocket(deviceId, onDataUpdate, zoneSessionId), 5000);
        };
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch(data.type) {
                case 'send_sensor_data':
                    updateDeviceSensorData(deviceId, data.data);
                    currentSensorData = data.data;
                    if (onDataUpdate) onDataUpdate(currentSensorData, currentOnlineStatus);
                    break;
                case 'device_status_data':
                    if (typeof data.data.online !== 'undefined') {
                        updateDeviceOnlineStatus(deviceId, !!data.data.online);
                        currentOnlineStatus = !!data.data.online;
                        if (onDataUpdate) onDataUpdate(currentSensorData, currentOnlineStatus);
                    }
                    break;
                default:
                    // игнорируем
            }
        };
        deviceWebSockets.set(deviceId, { ws, _manuallyClosed: false });
    };

    const updateDeviceOnlineStatus = (deviceId, isOnline) => {
        const deviceCard = document.querySelector(`[data-device-id="${deviceId}"]`);
        if (!deviceCard) return;
        const status = deviceCard.querySelector('.device-online-status');
        if (status) {
            status.className = `device-online-status ${isOnline ? 'online' : 'offline'}`;
            status.textContent = isOnline ? 'Онлайн' : 'Оффлайн';
        }
    };

    const updateDeviceSensorData = (deviceId, data) => {
        const deviceCard = document.querySelector(`[data-device-id="${deviceId}"]`);
        if (!deviceCard) return;
        const contentContainer = deviceCard.querySelector('.sensor-data-content');
        if (!contentContainer) return;
        contentContainer.innerHTML = '';
        Object.entries(data).forEach(([key, value]) => {
            const item = document.createElement('div');
            item.className = 'sensor-data-item';
            item.innerHTML = `
                <span class="sensor-data-label">${formatSensorLabel(key)}</span>
                <span class="sensor-data-value">${formatSensorValue(value)}</span>
            `;
            contentContainer.appendChild(item);
        });
    };

    const formatSensorLabel = (key) => {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const formatSensorValue = (value) => {
        if (typeof value === 'number') {
            return value.toFixed(2);
        }
        return value;
    };

    // === Вспомогательные функции ===
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

    const formatDate = dateString => {
        if (!dateString) return '';
        if (dateString.match(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/)) {
            return dateString;
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Некорректная дата';
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // === Создание карточки устройства ===
    const createDeviceCard = (device) => {
        const card = document.createElement('div');
        card.className = 'device-card';
        card.dataset.deviceId = device.id;

        // Заголовок карточки
        const header = document.createElement('div');
        header.className = 'device-header';

        const icon = document.createElement('div');
        icon.className = 'device-icon';
        icon.innerHTML = `<i class="${deviceTypeIcons[device.model.device_type] || deviceTypeIcons.other}"></i>`;

        const title = document.createElement('div');
        title.className = 'device-title';

        const name = document.createElement('h3');
        name.className = 'device-name';
        name.textContent = device.name;

        const type = document.createElement('p');
        type.className = 'device-type';
        type.textContent = device.model.device_type;

        // Новый блок: производитель и описание
        const manufacturer = document.createElement('p');
        manufacturer.className = 'device-manufacturer';
        manufacturer.textContent = device.model.manufacturer;

        const description = document.createElement('p');
        description.className = 'device-description';
        description.textContent = device.model.description;

        title.appendChild(name);
        title.appendChild(type);
        title.appendChild(manufacturer);
        title.appendChild(description);
        header.appendChild(icon);
        header.appendChild(title);

        // Статус онлайн/оффлайн (будет обновляться через WebSocket)
        const onlineStatus = document.createElement('div');
        onlineStatus.className = 'device-online-status offline';
        onlineStatus.textContent = 'Оффлайн';
        header.appendChild(onlineStatus);

        // Блок данных сенсора (будет обновляться через WebSocket)
        const sensorDataContainer = document.createElement('div');
        sensorDataContainer.className = 'sensor-data';
        sensorDataContainer.innerHTML = `
            <div class="sensor-data-header">
                <h4 class="sensor-data-title">Данные сенсора</h4>
            </div>
            <div class="sensor-data-content"></div>
        `;

        // Собираем карточку
        card.appendChild(header);
        card.appendChild(sensorDataContainer);

        // Для хранения последних данных
        let lastSensorData = {};
        let lastOnlineStatus = false;

        // Клик по карточке — открыть модальное окно с полной инфой
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('model-toggle')) {
                showDeviceModal(device, lastSensorData, lastOnlineStatus);
            }
        });

        // Подключаемся к WebSocket после создания карточки
        connectToDeviceWebSocket(device.id, (sensorData, onlineStatus) => {
            lastSensorData = sensorData;
            lastOnlineStatus = onlineStatus;
        }, currentZoneSessionId);

        return card;
    };

    function closeAllDeviceWebSockets() {
        deviceWebSockets.forEach(obj => {
            try {
                obj._manuallyClosed = true;
                obj.ws.close();
            } catch {}
        });
        deviceWebSockets.clear();
    }

    // === Загрузка устройств зоны ===
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

    // === Обработка событий ===
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
        if (devicesContainer) {
            devicesContainer.innerHTML = '';
        }
        currentZoneName = null;
    });

    // === Инициализация ===
    showEmptyDeviceCard();
});

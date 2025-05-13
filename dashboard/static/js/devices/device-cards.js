class DevicesManager {
    constructor(orgSlug, farmSlug, zoneId) {
        this.orgSlug = orgSlug;
        this.farmSlug = farmSlug;
        this.zoneId = zoneId;
        this.devicesContainer = document.querySelector(`#zone-${zoneId} .devices-container`);
        this.deviceSockets = new Map();
        this.loadDevices();
    }

    async loadDevices() {
        try {
            const response = await fetch(`/api/v1/DevicesPage/zones_devices/?zone=${this.zoneId}`);
            const devices = await response.json();
            
            // Создаем карточки устройств
            this.devicesContainer.innerHTML = `
                <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    ${devices.map(device => this.createDeviceCard(device)).join('')}
                </div>
            `;

            // Подключаем WebSocket для каждого устройства
            devices.forEach(device => {
                this.connectDeviceSocket(device);
            });
        } catch (error) {
            console.error('Error loading devices:', error);
            this.showError('Ошибка загрузки устройств');
        }
    }

    createDeviceCard(device) {
        return `
            <div class="col">
                <div class="card h-100" id="device-${device.id}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">${device.name}</h5>
                        <span class="badge ${device.is_active ? 'bg-success' : 'bg-danger'}">
                            ${device.is_active ? 'Активно' : 'Неактивно'}
                        </span>
                    </div>
                    <div class="card-body">
                        <p class="card-text">
                            <strong>Модель:</strong> ${device.model.name}<br>
                            <strong>Серийный номер:</strong> ${device.serial_number}<br>
                            <strong>Тип подключения:</strong> ${device.connection_type}
                        </p>
                        <div class="sensor-data">
                            <div class="spinner-border spinner-border-sm" role="status">
                                <span class="visually-hidden">Загрузка данных...</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-primary btn-sm toggle-device" 
                                data-device-id="${device.id}"
                                ${!device.is_active ? 'disabled' : ''}>
                            ${device.is_active ? 'Выключить' : 'Включить'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    connectDeviceSocket(device) {
        const socket = new WebSocket(
            `ws://${window.location.host}/ws/sensor-data/${device.id}/`
        );

        socket.onopen = () => {
            console.log(`WebSocket connected for device ${device.id}`);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.updateDeviceCard(device.id, data);
        };

        socket.onclose = () => {
            console.log(`WebSocket closed for device ${device.id}`);
            // Попытка переподключения через 5 секунд
            setTimeout(() => this.connectDeviceSocket(device), 5000);
        };

        this.deviceSockets.set(device.id, socket);
    }

    updateDeviceCard(deviceId, data) {
        const card = document.querySelector(`#device-${deviceId}`);
        if (!card) return;

        const sensorDataContainer = card.querySelector('.sensor-data');
        sensorDataContainer.innerHTML = `
            <div class="sensor-values">
                ${Object.entries(data.sensor_data).map(([key, value]) => `
                    <div class="sensor-value">
                        <strong>${key}:</strong> ${value}
                    </div>
                `).join('')}
            </div>
            <small class="text-muted">
                Последнее обновление: ${new Date(data.timestamp).toLocaleString()}
            </small>
        `;
    }

    showError(message) {
        this.devicesContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                ${message}
            </div>
        `;
    }

    // Закрытие всех WebSocket соединений при уничтожении менеджера
    destroy() {
        this.deviceSockets.forEach(socket => {
            socket.close();
        });
        this.deviceSockets.clear();
    }
} 
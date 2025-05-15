export function showDeviceModal(device, sensorData = {}, onlineStatus = false) {
    // Удалить старую модалку, если есть
    const oldModal = document.getElementById('device-modal');
    if (oldModal) oldModal.remove();

    // Создать оверлей
    const overlay = document.createElement('div');
    overlay.id = 'device-modal';
    overlay.className = 'device-modal-overlay';

    // Модальное окно
    const modal = document.createElement('div');
    modal.className = 'device-modal-window';

    // Кнопка закрытия
    const closeBtn = document.createElement('button');
    closeBtn.className = 'device-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => overlay.remove();

    // Заголовок
    const header = document.createElement('div');
    header.className = 'device-modal-header';
    header.innerHTML = `
        <div class="device-modal-title">${device.name}</div>
        <div class="device-modal-type">${device.model.device_type}</div>
        <div class="device-modal-manufacturer">${device.model.manufacturer}</div>
        <div class="device-modal-description">${device.model.description}</div>
        <div class="device-modal-online-status ${onlineStatus ? 'online' : 'offline'}">
            ${onlineStatus ? 'Онлайн' : 'Оффлайн'}
        </div>
    `;

    // Основная информация
    const info = document.createElement('div');
    info.className = 'device-modal-info';
    const infoItems = [
        { label: 'Серийный номер', value: device.serial_number },
        { label: 'Тип подключения', value: device.connection_type },
        { label: 'MAC адрес', value: device.mac_address },
        { label: 'IP адрес', value: device.ip_address },
        { label: 'Версия прошивки', value: device.firmware_version },
        { label: 'Статус', value: device.is_active ? 'Активно' : 'Неактивно' },
        { label: 'Дата установки', value: device.installation_date },
        { label: 'Последнее обслуживание', value: device.last_maintenance },
        { label: 'Интервал обслуживания', value: device.maintenance_interval }
    ];
    info.innerHTML = infoItems.filter(i => i.value).map(i => `
        <div class="device-modal-info-item">
            <span class="device-modal-info-label">${i.label}</span>
            <span class="device-modal-info-value">${i.value}</span>
        </div>
    `).join('');

    // Информация о модели
    const model = document.createElement('div');
    model.className = 'device-modal-model';
    const modelInfoItems = [
        { label: 'Модель', value: device.model.name },
        { label: 'Производитель', value: device.model.manufacturer },
        { label: 'Тип устройства', value: device.model.device_type },
        { label: 'Описание', value: device.model.description },
        { label: 'Дата создания', value: device.model.created_at },
        { label: 'Дата обновления', value: device.model.updated_at }
    ];
    model.innerHTML = modelInfoItems.filter(i => i.value).map(i => `
        <div class="device-modal-model-item">
            <span class="device-modal-model-label">${i.label}</span>
            <span class="device-modal-model-value">${i.value}</span>
        </div>
    `).join('');

    // Данные сенсора
    const sensor = document.createElement('div');
    sensor.className = 'device-modal-sensor';
    sensor.innerHTML = `<div class="device-modal-sensor-title">Данные сенсора</div>`;
    sensor.innerHTML += Object.keys(sensorData).length
        ? Object.entries(sensorData).map(([k, v]) => `
            <div class="device-modal-sensor-item">
                <span class="device-modal-sensor-label">${k}</span>
                <span class="device-modal-sensor-value">${v}</span>
            </div>
        `).join('')
        : '<div class="device-modal-sensor-empty">Нет данных</div>';

    // Собираем модалку
    modal.appendChild(closeBtn);
    modal.appendChild(header);
    modal.appendChild(info);
    modal.appendChild(model);
    modal.appendChild(sensor);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Закрытие по клику на фон
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

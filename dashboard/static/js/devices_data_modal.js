function translateSensorKey(key) {
    const dict = {
        humidity: 'Влажность',
        temperature: 'Температура',
        soil_moisture: 'Влажность почвы',
        light_intensity: 'Освещённость',
        ph_level: 'pH',
        battery_level: 'Уровень заряда',
        timestamp: 'Время обновления',
        cpu_usage: 'Загрузка CPU',
        memory_usage: 'Использование памяти',
        disk_usage: 'Использование диска',
        signal_strength: 'Уровень сигнала',
        online: 'Онлайн',
    };
    return dict[key] || key;
}

let currentModal = null;

export function showDeviceModal(device, sensorData = {}, deviceStatus = {}, onlineStatus = false, onDataUpdate = null) {
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
    closeBtn.className = 'device-modal-close-btn';
    closeBtn.title = 'Закрыть';
    closeBtn.innerHTML = `<i class='fa fa-times'></i>`;
    closeBtn.onclick = () => {
        overlay.remove();
        currentModal = null;
    };

    // Заголовок
    const header = document.createElement('div');
    header.className = 'device-modal-header-block device-modal-block';
    // Кнопка питания
    const powerBtn = document.createElement('button');
    powerBtn.className = 'device-modal-power-btn' + (onlineStatus ? ' online' : ' offline');
    powerBtn.title = onlineStatus ? 'Устройство онлайн' : 'Устройство оффлайн';
    powerBtn.innerHTML = `<i class='fa fa-power-off'></i>`;
    // Шапка: название и кнопки
    const headerRow = document.createElement('div');
    headerRow.className = 'device-modal-header-row';
    headerRow.appendChild(document.createElement('div'));
    headerRow.children[0].className = 'device-modal-title';
    headerRow.children[0].textContent = device.name;
    // Кнопки справа
    const headerBtns = document.createElement('div');
    headerBtns.className = 'device-modal-header-btns';
    headerBtns.appendChild(powerBtn);
    headerBtns.appendChild(closeBtn);
    headerRow.appendChild(headerBtns);
    header.appendChild(headerRow);

    // Левая колонка: два отдельных блока
    // 1. Основная информация
    const infoBlock = document.createElement('div');
    infoBlock.className = 'device-modal-block device-modal-info-block';
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
    infoBlock.appendChild(info);

    // 2. Информация о модели
    const modelBlock = document.createElement('div');
    modelBlock.className = 'device-modal-block device-modal-model-block';
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
    modelBlock.appendChild(model);

    // Правая колонка: два отдельных блока
    // 1. Статус устройства
    const status = document.createElement('div');
    status.className = 'device-modal-block device-modal-status';
    status.innerHTML = `<div class="device-modal-status-title">Статус устройства</div>`;
    const statusItems = [
        { key: 'cpu_usage', label: 'Загрузка CPU', value: deviceStatus.cpu_usage, unit: '%' },
        { key: 'memory_usage', label: 'Использование памяти', value: deviceStatus.memory_usage, unit: '%' },
        { key: 'disk_usage', label: 'Использование диска', value: deviceStatus.disk_usage, unit: '%' },
        { key: 'signal_strength', label: 'Уровень сигнала', value: deviceStatus.signal_strength, unit: 'dBm' },
        { key: 'timestamp', label: 'Время обновления', value: deviceStatus.timestamp }
    ];
    status.innerHTML += statusItems.some(item => item.value !== undefined)
        ? statusItems.filter(item => item.value !== undefined).map(item => `
            <div class="device-modal-status-item">
                <span class="device-modal-status-label">${item.label}</span>
                <span class="device-modal-status-value">
                    ${item.value}${item.unit ? item.unit : ''}
                </span>
            </div>
        `).join('')
        : '<div class="device-modal-status-empty">Нет данных о статусе</div>';

    // 2. Данные сенсора (и время)
    const sensor = document.createElement('div');
    sensor.className = 'device-modal-block device-modal-sensor';
    sensor.innerHTML = `<div class="device-modal-sensor-title">Данные сенсора</div>`;
    const sensorDataNoTimestamp = {...sensorData};
    delete sensorDataNoTimestamp.timestamp;
    sensor.innerHTML += Object.keys(sensorDataNoTimestamp).length
        ? Object.entries(sensorDataNoTimestamp).map(([k, v]) => `
            <div class="device-modal-sensor-item">
                <span class="device-modal-sensor-label">${translateSensorKey(k)}</span>
                <span class="device-modal-sensor-value">${v}</span>
            </div>
        `).join('')
        : '<div class="device-modal-sensor-empty">Нет данных</div>';
    if (sensorData.timestamp) {
        sensor.innerHTML += `<div class=\"device-modal-sensor-item\">
            <span class=\"device-modal-sensor-label\">${translateSensorKey('timestamp')}</span>
            <span class=\"device-modal-sensor-value\">${sensorData.timestamp}</span>
        </div>`;
    }

    // Layout: две колонки
    const columns = document.createElement('div');
    columns.className = 'device-modal-columns';
    const colLeft = document.createElement('div');
    colLeft.className = 'device-modal-col-left';
    colLeft.appendChild(infoBlock);
    colLeft.appendChild(modelBlock);
    const colRight = document.createElement('div');
    colRight.className = 'device-modal-col-right';
    colRight.appendChild(status);
    colRight.appendChild(sensor);
    columns.appendChild(colLeft);
    columns.appendChild(colRight);

    // Собираем модалку
    modal.appendChild(header);
    modal.appendChild(columns);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Сохраняем ссылку на модальное окно для обновлений
    currentModal = {
        overlay,
        modal,
        status,
        sensor,
        powerBtn,
        updateData: (newSensorData, newDeviceStatus, newOnlineStatus) => {
            // Обновляем статус онлайн/оффлайн
            powerBtn.className = 'device-modal-power-btn' + (newOnlineStatus ? ' online' : ' offline');
            powerBtn.title = newOnlineStatus ? 'Устройство онлайн' : 'Устройство оффлайн';

            // Обновляем статус устройства
            const statusItems = [
                { key: 'cpu_usage', label: 'Загрузка CPU', value: newDeviceStatus.cpu_usage, unit: '%' },
                { key: 'memory_usage', label: 'Использование памяти', value: newDeviceStatus.memory_usage, unit: '%' },
                { key: 'disk_usage', label: 'Использование диска', value: newDeviceStatus.disk_usage, unit: '%' },
                { key: 'signal_strength', label: 'Уровень сигнала', value: newDeviceStatus.signal_strength, unit: 'dBm' },
                { key: 'timestamp', label: 'Время обновления', value: newDeviceStatus.timestamp }
            ];
            status.innerHTML = `<div class="device-modal-status-title">Статус устройства</div>`;
            status.innerHTML += statusItems.some(item => item.value !== undefined)
                ? statusItems.filter(item => item.value !== undefined).map(item => `
                    <div class="device-modal-status-item">
                        <span class="device-modal-status-label">${item.label}</span>
                        <span class="device-modal-status-value">
                            ${item.value}${item.unit ? item.unit : ''}
                        </span>
                    </div>
                `).join('')
                : '<div class="device-modal-status-empty">Нет данных о статусе</div>';

            // Обновляем данные сенсора
            const sensorDataNoTimestamp = {...newSensorData};
            delete sensorDataNoTimestamp.timestamp;
            sensor.innerHTML = `<div class="device-modal-sensor-title">Данные сенсора</div>`;
            sensor.innerHTML += Object.keys(sensorDataNoTimestamp).length
                ? Object.entries(sensorDataNoTimestamp).map(([k, v]) => `
                    <div class="device-modal-sensor-item">
                        <span class="device-modal-sensor-label">${translateSensorKey(k)}</span>
                        <span class="device-modal-sensor-value">${v}</span>
                    </div>
                `).join('')
                : '<div class="device-modal-sensor-empty">Нет данных</div>';
            if (newSensorData.timestamp) {
                sensor.innerHTML += `<div class=\"device-modal-sensor-item\">
                    <span class=\"device-modal-sensor-label\">${translateSensorKey('timestamp')}</span>
                    <span class=\"device-modal-sensor-value\">${newSensorData.timestamp}</span>
                </div>`;
            }
        }
    };

    // Закрытие по клику на фон
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            currentModal = null;
        }
    });

    // Если есть функция обновления данных, передаем ей функцию обновления модального окна
    if (onDataUpdate) {
        onDataUpdate((sensorData, deviceStatus, onlineStatus) => {
            if (currentModal) {
                currentModal.updateData(sensorData, deviceStatus, onlineStatus);
            }
        });
    }
}

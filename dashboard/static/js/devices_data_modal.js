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

export function showDeviceModal(device, sensorData = {}, actuatorData = {}, deviceStatus = {}, onlineStatus = false, onDataUpdate = null) {
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
    const statusFields = [
        { key: 'cpu_usage', label: 'Загрузка CPU', value: deviceStatus.cpu_usage, unit: '%' },
        { key: 'memory_usage', label: 'Использование памяти', value: deviceStatus.memory_usage, unit: '%' },
        { key: 'disk_usage', label: 'Использование диска', value: deviceStatus.disk_usage, unit: '%' },
        { key: 'signal_strength', label: 'Уровень сигнала', value: deviceStatus.signal_strength, unit: 'dBm' },
        { key: 'timestamp', label: 'Время обновления', value: deviceStatus.timestamp }
    ];
    const hasStatusData = statusFields.some(item => item.value !== undefined && item.value !== null && item.value !== '');
    let status = null;
    if (hasStatusData) {
        status = document.createElement('div');
        status.className = 'device-modal-block device-modal-status';
        status.innerHTML = `<div class=\"device-modal-status-title\">Статус устройства</div>`;
        status.innerHTML += statusFields.filter(item => item.value !== undefined && item.value !== null && item.value !== '').map(item => `
            <div class=\"device-modal-status-item\">
                <span class=\"device-modal-status-label\">${item.label}</span>
                <span class=\"device-modal-status-value\">${item.value}${item.unit ? item.unit : ''}</span>
            </div>
        `).join('');
    }

    // 2. Данные сенсора (и время)
    let hasSensorData = Object.keys(sensorData || {}).filter(k => !['timestamp','sensor_timestamp','actuator_timestamp','action','intensity','duration'].includes(k)).length > 0;
    if (sensorData.sensor_timestamp) hasSensorData = true;
    if (sensorData.timestamp && !(sensorData.action || sensorData.intensity || sensorData.duration)) hasSensorData = true;
    let sensor = null;
    if (hasSensorData) {
        sensor = document.createElement('div');
        sensor.className = 'device-modal-block device-modal-sensor';
        sensor.innerHTML = `<div class=\"device-modal-sensor-title\">Данные сенсора</div>`;
        // Исключаем поля актуатора из данных сенсора
        const sensorDataNoTimestamp = {...sensorData};
        delete sensorDataNoTimestamp.timestamp;
        delete sensorDataNoTimestamp.sensor_timestamp;
        delete sensorDataNoTimestamp.actuator_timestamp;
        delete sensorDataNoTimestamp.action;
        delete sensorDataNoTimestamp.intensity;
        delete sensorDataNoTimestamp.duration;
        sensor.innerHTML += Object.keys(sensorDataNoTimestamp).length
            ? Object.entries(sensorDataNoTimestamp).map(([k, v]) => `
                <div class=\"device-modal-sensor-item\">
                    <span class=\"device-modal-sensor-label\">${translateSensorKey(k)}</span>
                    <span class=\"device-modal-sensor-value\">${v}</span>
                </div>
            `).join('')
            : '';
        // Показываем только свой timestamp
        if (sensorData.sensor_timestamp) {
            sensor.innerHTML += `<div class=\"device-modal-sensor-item\">
                <span class=\"device-modal-sensor-label\">Время обновления</span>
                <span class=\"device-modal-sensor-value\">${sensorData.sensor_timestamp}</span>
            </div>`;
        } else if (sensorData.timestamp && !(sensorData.action || sensorData.intensity || sensorData.duration)) {
            sensor.innerHTML += `<div class=\"device-modal-sensor-item\">
                <span class=\"device-modal-sensor-label\">Время обновления</span>
                <span class=\"device-modal-sensor-value\">${sensorData.timestamp}</span>
            </div>`;
        }
    }

    // 3. Данные актуатора (если есть)
    const actuator = document.createElement('div');
    actuator.className = 'device-modal-block device-modal-actuator';
    actuator.innerHTML = `<div class="device-modal-sensor-title">Данные актуатора</div>`;
    // Проверяем наличие данных актуатора
    const hasActuatorData = actuatorData.action || actuatorData.intensity || actuatorData.duration;
    if (hasActuatorData) {
        const actuatorItems = [
            { key: 'action', label: 'Действие', value: actuatorData.action },
            { key: 'intensity', label: 'Интенсивность', value: actuatorData.intensity, unit: '%' },
            { key: 'duration', label: 'Длительность', value: actuatorData.duration }
        ];
        actuator.innerHTML += actuatorItems
            .filter(item => item.value !== undefined)
            .map(item => `
                <div class="device-modal-sensor-item">
                    <span class="device-modal-sensor-label">${item.label}</span>
                    <span class="device-modal-sensor-value">
                        ${item.value}${item.unit ? item.unit : ''}
                    </span>
                </div>
            `).join('');
        // Показываем только свой timestamp
        if (actuatorData.actuator_timestamp) {
            actuator.innerHTML += `<div class=\"device-modal-sensor-item\">
                <span class=\"device-modal-sensor-label\">Время обновления</span>
                <span class=\"device-modal-sensor-value\">${actuatorData.actuator_timestamp}</span>
            </div>`;
        } else if (actuatorData.timestamp) {
            actuator.innerHTML += `<div class=\"device-modal-sensor-item\">
                <span class=\"device-modal-sensor-label\">Время обновления</span>
                <span class=\"device-modal-sensor-value\">${actuatorData.timestamp}</span>
            </div>`;
        }
    } else {
        actuator.innerHTML += '<div class="device-modal-sensor-empty">Нет данных актуатора</div>';
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
    if (hasStatusData && status) colRight.appendChild(status);
    if (hasSensorData && sensor) colRight.appendChild(sensor);
    if (hasActuatorData) {
        colRight.appendChild(actuator);
    }
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
        actuator,
        powerBtn,
        updateData: (newSensorData, newActuatorData, newDeviceStatus, newOnlineStatus) => {
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
            const hasNewStatusData = statusItems.some(item => item.value !== undefined && item.value !== null && item.value !== '');
            if (hasNewStatusData) {
                status.innerHTML = `<div class=\"device-modal-status-title\">Статус устройства</div>`;
                status.innerHTML += statusItems.filter(item => item.value !== undefined && item.value !== null && item.value !== '').map(item => `
                    <div class=\"device-modal-status-item\">
                        <span class=\"device-modal-status-label\">${item.label}</span>
                        <span class=\"device-modal-status-value\">${item.value}${item.unit ? item.unit : ''}</span>
                    </div>
                `).join('');
                if (!colRight.contains(status)) {
                    colRight.insertBefore(status, sensor || actuator);
                }
            } else {
                if (colRight.contains(status)) {
                    status.remove();
                }
            }

            // Обновляем данные сенсора
            let hasNewSensorData = Object.keys(newSensorData || {}).filter(k => !['timestamp','sensor_timestamp','actuator_timestamp','action','intensity','duration'].includes(k)).length > 0;
            if (newSensorData.sensor_timestamp) hasNewSensorData = true;
            if (newSensorData.timestamp && !(newSensorData.action || newSensorData.intensity || newSensorData.duration)) hasNewSensorData = true;
            if (hasNewSensorData) {
                sensor.innerHTML = `<div class=\"device-modal-sensor-title\">Данные сенсора</div>`;
                const sensorDataNoTimestamp = {...newSensorData};
                delete sensorDataNoTimestamp.timestamp;
                delete sensorDataNoTimestamp.sensor_timestamp;
                delete sensorDataNoTimestamp.actuator_timestamp;
                delete sensorDataNoTimestamp.action;
                delete sensorDataNoTimestamp.intensity;
                delete sensorDataNoTimestamp.duration;
                sensor.innerHTML += Object.keys(sensorDataNoTimestamp).length
                    ? Object.entries(sensorDataNoTimestamp).map(([k, v]) => `
                        <div class=\"device-modal-sensor-item\">
                            <span class=\"device-modal-sensor-label\">${translateSensorKey(k)}</span>
                            <span class=\"device-modal-sensor-value\">${v}</span>
                        </div>
                    `).join('')
                    : '';
                if (newSensorData.sensor_timestamp) {
                    sensor.innerHTML += `<div class=\"device-modal-sensor-item\">
                        <span class=\"device-modal-sensor-label\">Время обновления</span>
                        <span class=\"device-modal-sensor-value\">${newSensorData.sensor_timestamp}</span>
                    </div>`;
                } else if (newSensorData.timestamp && !(newSensorData.action || newSensorData.intensity || newSensorData.duration)) {
                    sensor.innerHTML += `<div class=\"device-modal-sensor-item\">
                        <span class=\"device-modal-sensor-label\">Время обновления</span>
                        <span class=\"device-modal-sensor-value\">${newSensorData.timestamp}</span>
                    </div>`;
                }
                if (!colRight.contains(sensor)) {
                    colRight.insertBefore(sensor, actuator);
                }
            } else {
                if (colRight.contains(sensor)) {
                    sensor.remove();
                }
            }

            // Обновляем данные актуатора
            const hasNewActuatorData = newActuatorData.action || newActuatorData.intensity || newActuatorData.duration;
            if (hasNewActuatorData) {
                const actuatorItems = [
                    { key: 'action', label: 'Действие', value: newActuatorData.action },
                    { key: 'intensity', label: 'Интенсивность', value: newActuatorData.intensity, unit: '%' },
                    { key: 'duration', label: 'Длительность', value: newActuatorData.duration }
                ];
                actuator.innerHTML = `<div class="device-modal-sensor-title">Данные актуатора</div>`;
                actuator.innerHTML += actuatorItems
                    .filter(item => item.value !== undefined)
                    .map(item => `
                        <div class="device-modal-sensor-item">
                            <span class="device-modal-sensor-label">${item.label}</span>
                            <span class="device-modal-sensor-value">
                                ${item.value}${item.unit ? item.unit : ''}
                            </span>
                        </div>
                    `).join('');
                // Показываем только свой timestamp
                if (newActuatorData.actuator_timestamp) {
                    actuator.innerHTML += `<div class=\"device-modal-sensor-item\">
                        <span class=\"device-modal-sensor-label\">Время обновления</span>
                        <span class=\"device-modal-sensor-value\">${newActuatorData.actuator_timestamp}</span>
                    </div>`;
                } else if (newActuatorData.timestamp) {
                    actuator.innerHTML += `<div class=\"device-modal-sensor-item\">
                        <span class=\"device-modal-sensor-label\">Время обновления</span>
                        <span class=\"device-modal-sensor-value\">${newActuatorData.timestamp}</span>
                    </div>`;
                }
                // Показываем блок актуатора, если его еще нет
                if (!colRight.contains(actuator)) {
                    colRight.appendChild(actuator);
                }
            } else {
                // Скрываем блок актуатора, если данных нет
                if (colRight.contains(actuator)) {
                    actuator.remove();
                }
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
    if (typeof onDataUpdate === 'function') {
        onDataUpdate((sensorData, actuatorData, deviceStatus, onlineStatus) => {
            if (currentModal) {
                currentModal.updateData(sensorData, actuatorData, deviceStatus, onlineStatus);
            }
        });
    }
}

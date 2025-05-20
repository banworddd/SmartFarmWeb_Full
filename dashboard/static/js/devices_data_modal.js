let currentModal = null;
export { currentModal };

// =====================
// Константы и маппинги
// =====================
const SENSOR_LABELS = {
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

const DEVICE_FIELD_LABELS = {
    id: 'ID',
    name: 'Название',
    serial_number: 'Серийный номер',
    connection_type: 'Тип подключения',
    mac_address: 'MAC адрес',
    ip_address: 'IP адрес',
    firmware_version: 'Версия прошивки',
    is_active: 'Статус',
    installation_date: 'Дата установки',
    last_maintenance: 'Последнее обслуживание',
    maintenance_interval: 'Интервал обслуживания (дней)',
    created_at: 'Создано',
    updated_at: 'Обновлено',
    farm_name: 'Ферма',
    added_by_name: 'Добавил',
    gateway_name: 'Шлюз',
    device_zone: 'Зона',
};

const MODEL_FIELD_LABELS = {
    id: 'ID',
    name: 'Модель',
    manufacturer: 'Производитель',
    device_type: 'Тип устройства',
    description: 'Описание',
    updated_at: 'Обновлено',
    created_at: 'Создано',
    specifications: 'Характеристики',
};

const EXCLUDED_FIELDS = ['model', 'farm', 'added_by', 'gateway_device', 'id', 'device_location_id', 'farm_slug'];
const EDITABLE_FIELDS = [
    'name', 'serial_number', 'connection_type', 'mac_address', 'ip_address', 'firmware_version',
    'is_active', 'installation_date', 'last_maintenance', 'maintenance_interval', 'model', 'farm_name', 'device_zone'
];

// =============
// Утилиты
// =============
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

const formatDisplayValue = (value, key) => {
    if (value === null || value === undefined || value === '') return 'не указано';
    if (key === 'is_active') return value ? 'Активно' : 'Неактивно';
    return value;
};

const translateSensorKey = key => SENSOR_LABELS[key] || key;

const fetchDeviceModels = async () => {
    try {
        const response = await fetch('/api/v1/devices/device_models/');
        if (!response.ok) throw new Error('Failed to fetch device models');
        return await response.json();
    } catch {
        return [];
    }
};

const fetchUserFarms = async () => {
    try {
        const response = await fetch('/api/v1/user_pages/user_farms/?role=owner&role=admin');
        if (!response.ok) throw new Error('Failed to fetch user farms');
        return await response.json();
    } catch {
        return [];
    }
};

// =====================
// Основной интерфейс
// =====================
export function showDeviceModal(device, sensorData = {}, actuatorData = {}, deviceStatus = {}, onlineStatus = false, onDataUpdate = null) {
    // Если модалка уже есть — обновляем только данные
    if (currentModal) {
        updateModalData(device, sensorData, actuatorData, deviceStatus, onlineStatus);
        return;
    }
    // Удаляем старую модалку, если есть
    document.getElementById('device-modal')?.remove();

    // --- Создание DOM-структуры ---
    const overlay = document.createElement('div');
    overlay.id = 'device-modal';
    overlay.className = 'device-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'device-modal-window';

    // Header
    const header = createHeader(device, onlineStatus, overlay);
    // Info block
    const infoBlock = createInfoBlock(device, overlay);
    // Model block
    const modelBlock = createModelBlock(device);
    // Status, sensor, actuator blocks
    const { status, sensor, actuator, colRight } = createRightBlocks();

    // Layout: две колонки
    const columns = document.createElement('div');
    columns.className = 'device-modal-columns';
    const colLeft = document.createElement('div');
    colLeft.className = 'device-modal-col-left';
    colLeft.appendChild(infoBlock);
    colLeft.appendChild(modelBlock);
    columns.appendChild(colLeft);
    columns.appendChild(colRight);

    // Первичное заполнение блоков данными
    if (renderStatusBlock(status, deviceStatus)) colRight.appendChild(status); else status.remove();
    if (renderSensorBlock(sensor, sensorData)) colRight.appendChild(sensor); else sensor.remove();
    if (renderActuatorBlock(actuator, actuatorData)) colRight.appendChild(actuator); else actuator.remove();

    modal.appendChild(header);
    modal.appendChild(columns);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Стилизация селектов и ошибок
    addModalStyles();

    // Сохраняем ссылку на модалку
    currentModal = {
        overlay,
        modal,
        status,
        sensor,
        actuator,
        powerBtn: header.querySelector('.device-modal-power-btn'),
        updateData: (newSensor, newActuator, newStatus, newOnline) => {
            updateModalData(device, newSensor, newActuator, newStatus, newOnline);
        }
    };

    // Закрытие по клику на фон
    overlay.addEventListener('click', e => {
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

// =====================
// DOM-генераторы
// =====================
function createHeader(device, onlineStatus, overlay) {
    const header = document.createElement('div');
    header.className = 'device-modal-header-block device-modal-block';
    const powerBtn = document.createElement('button');
    powerBtn.className = 'device-modal-power-btn' + (onlineStatus ? ' online' : ' offline');
    powerBtn.title = onlineStatus ? 'Устройство онлайн' : 'Устройство оффлайн';
    powerBtn.innerHTML = `<i class='fa fa-power-off'></i>`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'device-modal-close-btn';
    closeBtn.title = 'Закрыть';
    closeBtn.innerHTML = `<i class='fa fa-times'></i>`;
    closeBtn.onclick = () => {
        overlay.remove();
        currentModal = null;
    };
    const headerRow = document.createElement('div');
    headerRow.className = 'device-modal-header-row';
    headerRow.appendChild(document.createElement('div'));
    headerRow.children[0].className = 'device-modal-title';
    headerRow.children[0].textContent = device.name;
    const headerBtns = document.createElement('div');
    headerBtns.className = 'device-modal-header-btns';
    headerBtns.appendChild(powerBtn);
    headerBtns.appendChild(closeBtn);
    headerRow.appendChild(headerBtns);
    header.appendChild(headerRow);
    return header;
}

function createInfoBlock(device, overlay) {
    const infoBlock = document.createElement('div');
    infoBlock.className = 'device-modal-block device-modal-info-block';
    const info = document.createElement('div');
    info.className = 'device-modal-info';
    const infoItems = Object.entries(device)
        .filter(([key]) => !EXCLUDED_FIELDS.includes(key))
        .map(([key, value]) => {
            const displayValue = formatDisplayValue(value, key);
            const canEdit = EDITABLE_FIELDS.includes(key);
            return `<div class="device-modal-info-item" data-field="${key}">
                <span class="device-modal-info-label">${DEVICE_FIELD_LABELS[key] || key}</span>
                <span class="device-modal-info-value">${displayValue}
                    ${canEdit ? '<i class="fa fa-pencil edit-field-btn" title="Редактировать"></i>' : ''}
                </span>
            </div>`;
        });
    info.innerHTML = infoItems.join('');
    infoBlock.appendChild(info);
    addEditHandlers(info, device, overlay);
    return infoBlock;
}

function createModelBlock(device) {
    const modelBlock = document.createElement('div');
    modelBlock.className = 'device-modal-block device-modal-model-block';
    const model = document.createElement('div');
    model.className = 'device-modal-model';
    const modelItems = Object.entries(device.model || {})
        .filter(([key]) => key !== 'specifications' && key !== 'id')
        .map(([key, value]) => {
            let displayValue = value;
            if (displayValue === null || displayValue === undefined || displayValue === '') displayValue = 'не указано';
            return `<div class="device-modal-model-item">
                <span class="device-modal-model-label">${MODEL_FIELD_LABELS[key] || key}</span>
                <span class="device-modal-model-value">${displayValue}</span>
            </div>`;
        });
    if (device.model && device.model.specifications) {
        const specsObj = device.model.specifications;
        let specs = 'не указано';
        if (specsObj && Object.keys(specsObj).length) {
            specs = Object.entries(specsObj)
                .map(([k, v]) => `<div><b>${k}:</b> ${v === null || v === undefined || v === '' ? 'не указано' : v}</div>`).join('');
        }
        modelItems.push(`<div class="device-modal-model-item">
            <span class="device-modal-model-label">Характеристики</span>
            <span class="device-modal-model-value">${specs}</span>
        </div>`);
    }
    model.innerHTML = modelItems.join('');
    modelBlock.appendChild(model);
    return modelBlock;
}

function createRightBlocks() {
    const colRight = document.createElement('div');
    colRight.className = 'device-modal-col-right';
    // Статус
    const status = document.createElement('div');
    status.className = 'device-modal-block device-modal-status';
    // Сенсор
    const sensor = document.createElement('div');
    sensor.className = 'device-modal-block device-modal-sensor';
    // Актуатор
    const actuator = document.createElement('div');
    actuator.className = 'device-modal-block device-modal-actuator';
    colRight.appendChild(status);
    colRight.appendChild(sensor);
    colRight.appendChild(actuator);
    return { status, sensor, actuator, colRight };
}

function addModalStyles() {
    if (document.getElementById('device-modal-style')) return;
    const style = document.createElement('style');
    style.id = 'device-modal-style';
    style.textContent = `
        .device-modal-info .edit-input { color: #000; }
        .zone-selection-required .edit-input { border-color: #dc3545; }
    `;
    document.head.appendChild(style);
}

// =====================
// Обработчики редактирования
// =====================
function addEditHandlers(info, device, overlay) {
    info.addEventListener('click', async function(e) {
        const editBtn = e.target.closest('.edit-field-btn');
        if (!editBtn) return;
        const itemDiv = editBtn.closest('.device-modal-info-item');
        const field = itemDiv.dataset.field;
        if (!EDITABLE_FIELDS.includes(field)) return;
        if (info.querySelector('.editing')) return;
        let oldValue = device[field];
        let inputHtml = '';
        let isBool = false, isDate = false, isNumber = false, isModel = false;
        if (field === 'is_active') {
            inputHtml = `<select class="edit-input"><option value="true" ${oldValue ? 'selected' : ''}>Активно</option><option value="false" ${!oldValue ? 'selected' : ''}>Неактивно</option></select>`;
            isBool = true;
        } else if (field === 'installation_date' || field === 'last_maintenance') {
            inputHtml = `<input type="date" class="edit-input" value="${oldValue && oldValue !== 'не указано' ? oldValue : ''}">`;
            isDate = true;
        } else if (field === 'maintenance_interval') {
            inputHtml = `<input type="number" class="edit-input" value="${oldValue && oldValue !== 'не указано' ? oldValue : ''}" min="0">`;
            isNumber = true;
        } else if (field === 'model') {
            inputHtml = `<select class="edit-input"></select>`;
            isModel = true;
        } else if (field === 'farm_name') {
            fetchUserFarms().then(farms => {
                const select = document.createElement('select');
                select.className = 'edit-input';
                let currentFarmId = device.farm;
                farms.forEach(item => {
                    if (item.farm) {
                        const option = document.createElement('option');
                        option.value = item.farm.id;
                        option.textContent = item.farm.name;
                        if (item.farm.id === currentFarmId) option.selected = true;
                        select.appendChild(option);
                    }
                });
                const confirmBtn = document.createElement('button');
                confirmBtn.className = 'confirm-edit-btn';
                confirmBtn.innerHTML = '<i class="fa fa-check"></i>';
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'cancel-edit-btn';
                cancelBtn.innerHTML = '<i class="fa fa-times"></i>';
                const valueCell = itemDiv.querySelector('.device-modal-info-value');
                const oldHtml = valueCell.innerHTML;
                valueCell.innerHTML = '';
                valueCell.classList.add('editing');
                valueCell.appendChild(select);
                valueCell.appendChild(confirmBtn);
                valueCell.appendChild(cancelBtn);
                confirmBtn.onclick = async (e) => {
                    e.preventDefault();
                    const newFarmId = parseInt(select.value);
                    if (newFarmId === currentFarmId) return cancelBtn.onclick();
                    const oldFarmId = device.farm;
                    const oldFarmName = device.farm_name;
                    const oldZone = device.device_zone;
                    try {
                        const newFarm = farms.find(f => f.farm.id === newFarmId);
                        const newFarmSlug = newFarm?.farm_slug;
                        valueCell.innerHTML = `${newFarm?.farm.name || 'не указано'} <i class='fa fa-pencil edit-field-btn' title='Редактировать'></i>`;
                        valueCell.classList.remove('editing');
                        const zoneItem = info.querySelector('.device-modal-info-item[data-field="device_zone"]');
                        if (zoneItem) {
                            const zoneValueCell = zoneItem.querySelector('.device-modal-info-value');
                            const oldZoneHtml = zoneValueCell.innerHTML;
                            zoneValueCell.innerHTML = '';
                            zoneValueCell.classList.add('editing', 'zone-selection-required');
                            const zones = await fetch(`/api/v1/devices/org_farms_zones/?farm=${newFarmSlug}`).then(r => r.json());
                            const zoneSelect = document.createElement('select');
                            zoneSelect.className = 'edit-input';
                            zoneSelect.innerHTML = '<option value="">Выберите зону...</option>';
                            zones.forEach(zone => {
                                const option = document.createElement('option');
                                option.value = zone.id;
                                option.textContent = zone.name;
                                zoneSelect.appendChild(option);
                            });
                            zoneValueCell.appendChild(zoneSelect);
                            const zoneConfirmBtn = document.createElement('button');
                            zoneConfirmBtn.className = 'confirm-edit-btn';
                            zoneConfirmBtn.innerHTML = '<i class="fa fa-check"></i>';
                            zoneValueCell.appendChild(zoneConfirmBtn);
                            const zoneCancelBtn = document.createElement('button');
                            zoneCancelBtn.className = 'cancel-edit-btn';
                            zoneCancelBtn.innerHTML = '<i class="fa fa-times"></i>';
                            zoneValueCell.appendChild(zoneCancelBtn);
                            const onOverlayClose = () => {
                                device.farm = oldFarmId;
                                device.farm_name = oldFarmName;
                                device.device_zone = oldZone;
                                valueCell.innerHTML = `${oldFarmName} <i class='fa fa-pencil edit-field-btn' title='Редактировать'></i>`;
                                zoneValueCell.innerHTML = oldZoneHtml;
                                zoneValueCell.classList.remove('editing', 'zone-selection-required');
                            };
                            overlay.addEventListener('remove', onOverlayClose, { once: true });
                            zoneConfirmBtn.onclick = async (e) => {
                                e.preventDefault();
                                const newZoneId = parseInt(zoneSelect.value);
                                if (!newZoneId) {
                                    zoneSelect.classList.add('error-input');
                                    return;
                                }
                                try {
                                    const farmResp = await fetch(`/api/v1/devices/update_device/${device.id}/`, {
                                        method: 'PATCH',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'X-CSRFToken': getCookie('csrftoken')
                                        },
                                        body: JSON.stringify({ farm: newFarmId })
                                    });
                                    if (!farmResp.ok) throw new Error('Ошибка обновления фермы');
                                    const zoneResp = await fetch(`/api/v1/devices/update_device_location/${device.device_location_id}/`, {
                                        method: 'PATCH',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'X-CSRFToken': getCookie('csrftoken')
                                        },
                                        body: JSON.stringify({ zone: newZoneId })
                                    });
                                    if (!zoneResp.ok) throw new Error('Ошибка обновления зоны');
                                    const updatedDeviceResp = await fetch(`/api/v1/devices/device/${device.id}/`);
                                    const updatedDevice = await updatedDeviceResp.json();
                                    overlay.remove();
                                    currentModal = null;
                                    showDeviceModal(updatedDevice);
                                } catch (err) {
                                    onOverlayClose();
                                }
                            };
                            zoneCancelBtn.onclick = (e) => {
                                if (e) e.preventDefault();
                                onOverlayClose();
                            };
                        }
                    } catch (err) {
                        valueCell.innerHTML = oldHtml;
                        valueCell.classList.remove('editing');
                    }
                };
                cancelBtn.onclick = (e) => {
                    if (e) e.preventDefault();
                    valueCell.innerHTML = oldHtml;
                    valueCell.classList.remove('editing');
                };
            });
            return;
        } else if (field === 'device_zone') {
            let farmSlug = device.farm_slug;
            const getZones = (slug) => fetch(`/api/v1/devices/org_farms_zones/?farm=${slug}`).then(resp => resp.json());
            const showZoneSelect = (zones) => {
                const select = document.createElement('select');
                select.className = 'edit-input';
                if (!zones.length) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'нет зон';
                    option.disabled = true;
                    option.selected = true;
                    select.appendChild(option);
                } else {
                    zones.forEach(zone => {
                        const option = document.createElement('option');
                        option.value = zone.id;
                        option.textContent = zone.name;
                        if (zone.name === device.device_zone) option.selected = true;
                        select.appendChild(option);
                    });
                }
                const errorDiv = document.createElement('div');
                errorDiv.className = 'field-error';
                errorDiv.style.marginBottom = '6px';
                const confirmBtn = document.createElement('button');
                confirmBtn.className = 'confirm-edit-btn';
                confirmBtn.innerHTML = '<i class=\'fa fa-check\'></i>';
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'cancel-edit-btn';
                cancelBtn.innerHTML = '<i class=\'fa fa-times\'></i>';
                const valueCell = itemDiv.querySelector('.device-modal-info-value');
                const oldHtml = valueCell.innerHTML;
                valueCell.innerHTML = '';
                valueCell.classList.add('editing');
                valueCell.appendChild(errorDiv);
                valueCell.appendChild(select);
                valueCell.appendChild(confirmBtn);
                valueCell.appendChild(cancelBtn);
                confirmBtn.onclick = async (e) => {
                    e.preventDefault();
                    const newZoneId = parseInt(select.value);
                    if (!newZoneId) {
                        errorDiv.textContent = 'Выберите зону';
                        select.classList.add('error-input');
                        return;
                    }
                    if (!device.device_location_id) return;
                    try {
                        const resp = await fetch(`/api/v1/devices/update_device_location/${device.device_location_id}/`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': getCookie('csrftoken')
                            },
                            body: JSON.stringify({ zone: newZoneId })
                        });
                        if (!resp.ok) throw new Error('Ошибка обновления зоны');
                        device.device_zone = zones.find(z => z.id === newZoneId)?.name || 'не указано';
                        valueCell.innerHTML = `${device.device_zone} <i class=\'fa fa-pencil edit-field-btn\' title=\'Редактировать\'></i>`;
                        valueCell.classList.remove('editing');
                    } catch {
                        valueCell.innerHTML = oldHtml;
                        valueCell.classList.remove('editing');
                        alert('Ошибка обновления зоны');
                    }
                };
                cancelBtn.onclick = (e) => {
                    if (e) e.preventDefault();
                    valueCell.innerHTML = oldHtml;
                    valueCell.classList.remove('editing');
                };
            };
            if (farmSlug) {
                getZones(farmSlug).then(showZoneSelect);
            } else if (device.farm) {
                fetchUserFarms().then(farms => {
                    const found = farms.find(f => f.farm && f.farm.id === device.farm);
                    if (found && found.farm_slug) {
                        getZones(found.farm_slug).then(showZoneSelect);
                    } else {
                        const valueCell = itemDiv.querySelector('.device-modal-info-value');
                        valueCell.innerHTML = '<div class=\'field-error\'>Не удалось получить список зон для выбранной фермы</div>';
                    }
                });
            } else {
                const valueCell = itemDiv.querySelector('.device-modal-info-value');
                valueCell.innerHTML = '<div class=\'field-error\'>Нет информации о ферме для получения зон</div>';
            }
            return;
        } else {
            inputHtml = `<input type="text" class="edit-input" value="${oldValue && oldValue !== 'не указано' ? oldValue : ''}">`;
        }
        const valueSpan = itemDiv.querySelector('.device-modal-info-value');
        const oldHtml = valueSpan.innerHTML;
        valueSpan.classList.add('editing');
        valueSpan.innerHTML = `${inputHtml}
            <i class="fa fa-check confirm-edit-btn" title="Сохранить"></i>
            <i class="fa fa-times cancel-edit-btn" title="Отмена"></i>`;
        if (isModel) {
            const select = valueSpan.querySelector('select.edit-input');
            select.innerHTML = '<option value="">Загрузка...</option>';
            const models = await fetchDeviceModels();
            select.innerHTML = models.map(m => `<option value="${m.id}" ${device.model && m.id === device.model.id ? 'selected' : ''}>${m.name}</option>`).join('');
        }
        valueSpan.querySelector('.cancel-edit-btn').onclick = () => {
            valueSpan.classList.remove('editing');
            valueSpan.innerHTML = oldHtml;
        };
        valueSpan.querySelector('.confirm-edit-btn').onclick = async () => {
            let newValue;
            if (isBool) {
                newValue = valueSpan.querySelector('select').value === 'true';
            } else if (isDate) {
                newValue = valueSpan.querySelector('input').value || null;
            } else if (isNumber) {
                const v = valueSpan.querySelector('input').value;
                newValue = v === '' ? null : parseInt(v);
            } else if (isModel) {
                newValue = valueSpan.querySelector('select').value;
                if (!newValue) return;
            } else {
                newValue = valueSpan.querySelector('input').value;
            }
            const patchData = {};
            patchData[field] = isModel ? parseInt(newValue) : newValue;
            try {
                const resp = await fetch(`/api/v1/devices/update_device/${device.id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify(patchData)
                });
                if (!resp.ok) throw new Error('Ошибка обновления');
                if (isModel) {
                    const selectedModel = (await fetchDeviceModels()).find(m => m.id === parseInt(newValue));
                    device.model = selectedModel;
                    valueSpan.innerHTML = `${selectedModel.name} <i class="fa fa-pencil edit-field-btn" title="Редактировать"></i>`;
                } else {
                    device[field] = newValue;
                    let showValue = newValue;
                    if (field === 'is_active') showValue = newValue ? 'Активно' : 'Неактивно';
                    if (showValue === null || showValue === undefined || showValue === '') showValue = 'не указано';
                    valueSpan.innerHTML = `${showValue} <i class="fa fa-pencil edit-field-btn" title="Редактировать"></i>`;
                }
                valueSpan.classList.remove('editing');
            } catch {
                valueSpan.innerHTML = oldHtml;
                valueSpan.classList.remove('editing');
                alert('Ошибка обновления');
            }
        };
    });
}

// =====================
// Генерация блоков статуса, сенсора, актуатора
// =====================
function renderStatusBlock(statusElem, deviceStatus) {
    const statusFields = [
        { key: 'cpu_usage', label: 'Загрузка CPU', value: deviceStatus.cpu_usage, unit: '%' },
        { key: 'memory_usage', label: 'Использование памяти', value: deviceStatus.memory_usage, unit: '%' },
        { key: 'disk_usage', label: 'Использование диска', value: deviceStatus.disk_usage, unit: '%' },
        { key: 'signal_strength', label: 'Уровень сигнала', value: deviceStatus.signal_strength, unit: 'dBm' },
        { key: 'timestamp', label: 'Время обновления', value: deviceStatus.timestamp }
    ];
    const hasStatusData = statusFields.some(item => item.value !== undefined && item.value !== null && item.value !== '');
    if (!hasStatusData) {
        statusElem.innerHTML = '';
        return false;
    }
    statusElem.innerHTML = `<div class="device-modal-status-title">Статус устройства</div>` +
        statusFields.filter(item => item.value !== undefined && item.value !== null && item.value !== '').map(item => `
            <div class="device-modal-status-item">
                <span class="device-modal-status-label">${item.label}</span>
                <span class="device-modal-status-value">${item.value}${item.unit ? item.unit : ''}</span>
            </div>
        `).join('');
    return true;
}

function renderSensorBlock(sensorElem, sensorData) {
    let hasSensorData = Object.keys(sensorData || {}).filter(k => !['timestamp','sensor_timestamp','actuator_timestamp','action','intensity','duration'].includes(k)).length > 0;
    if (sensorData.sensor_timestamp) hasSensorData = true;
    if (sensorData.timestamp && !(sensorData.action || sensorData.intensity || sensorData.duration)) hasSensorData = true;
    if (!hasSensorData) {
        sensorElem.innerHTML = '';
        return false;
    }
    sensorElem.innerHTML = `<div class="device-modal-sensor-title">Данные сенсора</div>`;
    const sensorDataNoTimestamp = {...sensorData};
    delete sensorDataNoTimestamp.timestamp;
    delete sensorDataNoTimestamp.sensor_timestamp;
    delete sensorDataNoTimestamp.actuator_timestamp;
    delete sensorDataNoTimestamp.action;
    delete sensorDataNoTimestamp.intensity;
    delete sensorDataNoTimestamp.duration;
    if (Object.keys(sensorDataNoTimestamp).length) {
        sensorElem.innerHTML += Object.entries(sensorDataNoTimestamp).map(([k, v]) => `
            <div class="device-modal-sensor-item">
                <span class="device-modal-sensor-label">${translateSensorKey(k)}</span>
                <span class="device-modal-sensor-value">${v}</span>
            </div>
        `).join('');
    }
    if (sensorData.sensor_timestamp) {
        sensorElem.innerHTML += `<div class="device-modal-sensor-item">
            <span class="device-modal-sensor-label">Время обновления</span>
            <span class="device-modal-sensor-value">${sensorData.sensor_timestamp}</span>
        </div>`;
    } else if (sensorData.timestamp && !(sensorData.action || sensorData.intensity || sensorData.duration)) {
        sensorElem.innerHTML += `<div class="device-modal-sensor-item">
            <span class="device-modal-sensor-label">Время обновления</span>
            <span class="device-modal-sensor-value">${sensorData.timestamp}</span>
        </div>`;
    }
    return true;
}

function renderActuatorBlock(actuatorElem, actuatorData) {
    const hasActuatorData = actuatorData.action || actuatorData.intensity || actuatorData.duration;
    if (!hasActuatorData) {
        actuatorElem.innerHTML = '';
        return false;
    }
    const actuatorItems = [
        { key: 'action', label: 'Действие', value: actuatorData.action },
        { key: 'intensity', label: 'Интенсивность', value: actuatorData.intensity, unit: '%' },
        { key: 'duration', label: 'Длительность', value: actuatorData.duration }
    ];
    actuatorElem.innerHTML = `<div class="device-modal-sensor-title">Данные актуатора</div>` +
        actuatorItems.filter(item => item.value !== undefined)
            .map(item => `
                <div class="device-modal-sensor-item">
                    <span class="device-modal-sensor-label">${item.label}</span>
                    <span class="device-modal-sensor-value">
                        ${item.value}${item.unit ? item.unit : ''}
                    </span>
                </div>
            `).join('');
    if (actuatorData.actuator_timestamp) {
        actuatorElem.innerHTML += `<div class="device-modal-sensor-item">
            <span class="device-modal-sensor-label">Время обновления</span>
            <span class="device-modal-sensor-value">${actuatorData.actuator_timestamp}</span>
        </div>`;
    } else if (actuatorData.timestamp) {
        actuatorElem.innerHTML += `<div class="device-modal-sensor-item">
            <span class="device-modal-sensor-label">Время обновления</span>
            <span class="device-modal-sensor-value">${actuatorData.timestamp}</span>
        </div>`;
    }
    return true;
}

// =====================
// Обновление данных в модалке
// =====================
function updateModalData(device, sensorData, actuatorData, deviceStatus, onlineStatus) {
    if (!currentModal) return;
    // Заголовок
    const titleElement = currentModal.modal.querySelector('.device-modal-title');
    if (titleElement) titleElement.textContent = device.name;
    // Кнопка питания
    const powerBtn = currentModal.powerBtn;
    if (powerBtn) {
        powerBtn.className = 'device-modal-power-btn' + (onlineStatus ? ' online' : ' offline');
        powerBtn.title = onlineStatus ? 'Устройство онлайн' : 'Устройство оффлайн';
    }
    // Информация об устройстве
    const info = currentModal.modal.querySelector('.device-modal-info');
    if (info) {
        Object.entries(device)
            .filter(([key]) => !EXCLUDED_FIELDS.includes(key))
            .forEach(([key, value]) => {
                const item = info.querySelector(`[data-field="${key}"] .device-modal-info-value`);
                if (item && !item.classList.contains('editing')) {
                    let displayValue = formatDisplayValue(value, key);
                    item.innerHTML = `${displayValue} <i class="fa fa-pencil edit-field-btn" title="Редактировать"></i>`;
                }
            });
    }
    // Информация о модели
    const model = currentModal.modal.querySelector('.device-modal-model');
    if (model && device.model) {
        Object.entries(device.model)
            .filter(([key]) => key !== 'specifications' && key !== 'id')
            .forEach(([key, value]) => {
                const item = model.querySelector(`[data-key="${key}"] .device-modal-model-value`);
                if (item) {
                    let displayValue = value;
                    if (displayValue === null || displayValue === undefined || displayValue === '') displayValue = 'не указано';
                    item.textContent = displayValue;
                }
            });
    }
    // Статус, сенсор, актуатор
    if (renderStatusBlock(currentModal.status, deviceStatus)) {
        if (!currentModal.status.parentNode) currentModal.modal.querySelector('.device-modal-col-right').appendChild(currentModal.status);
    } else {
        currentModal.status.remove();
    }
    if (renderSensorBlock(currentModal.sensor, sensorData)) {
        if (!currentModal.sensor.parentNode) currentModal.modal.querySelector('.device-modal-col-right').appendChild(currentModal.sensor);
    } else {
        currentModal.sensor.remove();
    }
    if (renderActuatorBlock(currentModal.actuator, actuatorData)) {
        if (!currentModal.actuator.parentNode) currentModal.modal.querySelector('.device-modal-col-right').appendChild(currentModal.actuator);
    } else {
        currentModal.actuator.remove();
    }
}

// =====================
// Константы и утилиты
// =====================
const API = {
    deviceModels: '/api/v1/devices/device_models/',
    userFarms: '/api/v1/user_pages/user_farms/?role=owner&role=admin',
    farmZones: farmSlug => `/api/v1/devices/org_farms_zones/?farm=${farmSlug}`,
    addDevice: '/api/v1/devices/add_device/',
    addDeviceLocation: '/api/v1/devices/add_device_location/'
};

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

// =====================
// API-запросы
// =====================
async function fetchDeviceModels() {
    try {
        const response = await fetch(API.deviceModels);
        if (!response.ok) throw new Error('Failed to fetch device models');
        return await response.json();
    } catch (error) {
        console.error('Error fetching device models:', error);
        return [];
    }
}

async function fetchUserFarms() {
    try {
        const response = await fetch(API.userFarms);
        if (!response.ok) throw new Error('Failed to fetch user farms');
        return await response.json();
    } catch (error) {
        console.error('Error fetching user farms:', error);
        return [];
    }
}

async function fetchFarmZones(farmSlug) {
    try {
        const response = await fetch(API.farmZones(farmSlug));
        if (!response.ok) throw new Error('Failed to fetch farm zones');
        return await response.json();
    } catch (error) {
        console.error('Error fetching farm zones:', error);
        return [];
    }
}

// =====================
// Модальное окно добавления устройства
// =====================
function showAddDeviceModal() {
    // --- Оверлей и модалка ---
    const overlay = document.createElement('div');
    overlay.id = 'add-device-modal';
    overlay.className = 'device-modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'device-modal-window';

    // --- Кнопка закрытия ---
    const closeBtn = document.createElement('button');
    closeBtn.className = 'device-modal-close-btn';
    closeBtn.title = 'Закрыть';
    closeBtn.innerHTML = `<i class='fa fa-times'></i>`;
    closeBtn.onclick = () => overlay.remove();

    // --- Заголовок ---
    const header = document.createElement('div');
    header.className = 'device-modal-header-block device-modal-block';
    const headerRow = document.createElement('div');
    headerRow.className = 'device-modal-header-row';
    headerRow.innerHTML = `
        <div class="device-modal-title">Добавить устройство</div>
        <div class="device-modal-header-btns"></div>
    `;
    headerRow.querySelector('.device-modal-header-btns').appendChild(closeBtn);
    header.appendChild(headerRow);

    // --- Форма ---
    const form = document.createElement('form');
    form.className = 'add-device-form';
    form.innerHTML = `
        <div class="form-group">
            <label for="deviceName">Название устройства</label>
            <div class="field-error" id="error-deviceName"></div>
            <div class="input-wrapper">
                <i class="fa fa-microchip field-icon"></i>
                <input type="text" id="deviceName" name="name">
            </div>
        </div>
        <div class="form-group">
            <label for="deviceModel">Модель устройства</label>
            <div class="field-error" id="error-deviceModel"></div>
            <div class="input-wrapper">
                <i class="fa fa-cube field-icon"></i>
                <select id="deviceModel" name="model">
                    <option value="">Выберите модель</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label for="deviceFarm">Ферма</label>
            <div class="field-error" id="error-deviceFarm"></div>
            <div class="input-wrapper">
                <i class="fa fa-home field-icon"></i>
                <select id="deviceFarm" name="farm">
                    <option value="">Выберите ферму</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label for="deviceZone">Зона</label>
            <div class="field-error" id="error-deviceZone"></div>
            <div class="input-wrapper">
                <i class="fa fa-map-marker field-icon"></i>
                <select id="deviceZone" name="zone" disabled>
                    <option value="">Сначала выберите ферму</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label for="serialNumber">Серийный номер</label>
            <div class="field-error" id="error-serialNumber"></div>
            <div class="input-wrapper">
                <i class="fa fa-barcode field-icon"></i>
                <input type="text" id="serialNumber" name="serial_number">
            </div>
        </div>
        <div class="form-group">
            <label for="macAddress">MAC адрес</label>
            <div class="field-error" id="error-macAddress"></div>
            <div class="input-wrapper">
                <i class="fa fa-wifi field-icon"></i>
                <input type="text" id="macAddress" name="mac_address">
            </div>
        </div>
        <div class="form-group">
            <label for="ipAddress">IP адрес</label>
            <div class="field-error" id="error-ipAddress"></div>
            <div class="input-wrapper">
                <i class="fa fa-globe field-icon"></i>
                <input type="text" id="ipAddress" name="ip_address">
            </div>
        </div>
        <div class="form-group">
            <label for="connectionType">Тип подключения</label>
            <div class="field-error" id="error-connectionType"></div>
            <div class="input-wrapper">
                <i class="fa fa-plug field-icon"></i>
                <select id="connectionType" name="connection_type">
                    <option value="">Выберите тип подключения</option>
                    <option value="wifi">WiFi</option>
                    <option value="ethernet">Ethernet</option>
                    <option value="cellular">Cellular</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label for="firmwareVersion">Версия прошивки</label>
            <div class="field-error" id="error-firmwareVersion"></div>
            <div class="input-wrapper">
                <i class="fa fa-code field-icon"></i>
                <input type="text" id="firmwareVersion" name="firmware_version">
            </div>
        </div>
        <div class="form-group checkbox-group">
            <input type="checkbox" id="isActive" name="is_active" checked>
            <label for="isActive">Активно</label>
        </div>
        <div class="form-group">
            <label for="installationDate">Дата установки</label>
            <div class="field-error" id="error-installationDate"></div>
            <div class="input-wrapper">
                <i class="fa fa-calendar field-icon"></i>
                <input type="date" id="installationDate" name="installation_date">
            </div>
        </div>
        <div class="form-group">
            <label for="lastMaintenance">Последнее обслуживание</label>
            <div class="field-error" id="error-lastMaintenance"></div>
            <div class="input-wrapper">
                <i class="fa fa-wrench field-icon"></i>
                <input type="date" id="lastMaintenance" name="last_maintenance">
            </div>
        </div>
        <div class="form-group">
            <label for="maintenanceInterval">Интервал обслуживания (дней)</label>
            <div class="field-error" id="error-maintenanceInterval"></div>
            <div class="input-wrapper">
                <i class="fa fa-hourglass-half field-icon"></i>
                <input type="number" id="maintenanceInterval" name="maintenance_interval" min="0">
            </div>
        </div>
        <div class="form-actions">
            <button type="submit" class="submit-btn">Добавить</button>
            <button type="button" class="cancel-btn" onclick="this.closest('.device-modal-overlay').remove()">Отмена</button>
        </div>
    `;

    // --- Обработчики формы ---
    const farmSelect = form.querySelector('#deviceFarm');
    const zoneSelect = form.querySelector('#deviceZone');
    farmSelect.addEventListener('change', async (e) => {
        const selectedFarmId = e.target.value;
        zoneSelect.innerHTML = '<option value="">Выберите зону</option>';
        if (selectedFarmId) {
            zoneSelect.disabled = true;
            zoneSelect.innerHTML = '<option value="">Загрузка зон...</option>';
            const farmSlug = farmSelect._idToSlug ? farmSelect._idToSlug[selectedFarmId] : null;
            if (!farmSlug) {
                zoneSelect.disabled = true;
                zoneSelect.innerHTML = '<option value="">Не удалось получить слаг фермы</option>';
                return;
            }
            const zones = await fetchFarmZones(farmSlug);
            zoneSelect.innerHTML = '<option value="">Выберите зону</option>';
            zones.forEach(zone => {
                const option = document.createElement('option');
                option.value = zone.id;
                option.textContent = zone.name;
                zoneSelect.appendChild(option);
            });
            zoneSelect.disabled = false;
        } else {
            zoneSelect.disabled = true;
            zoneSelect.innerHTML = '<option value="">Сначала выберите ферму</option>';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();
        if (!validateFormFields()) return;
        const formData = new FormData(form);
        const deviceData = {
            model: formData.get('model'),
            name: formData.get('name'),
            serial_number: formData.get('serial_number'),
            connection_type: formData.get('connection_type'),
            mac_address: formData.get('mac_address'),
            ip_address: formData.get('ip_address'),
            firmware_version: formData.get('firmware_version') || null,
            is_active: formData.get('is_active') === 'on',
            installation_date: formData.get('installation_date') || null,
            last_maintenance: formData.get('last_maintenance') || null,
            maintenance_interval: formData.get('maintenance_interval') ? parseInt(formData.get('maintenance_interval')) : null,
            farm: formData.get('farm'),
            added_by: null,
            gateway_device: null
        };
        try {
            const response = await fetch(API.addDevice, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(deviceData)
            });
            const responseText = await response.text();
            if (!response.ok) {
                let errors = {};
                try { errors = JSON.parse(responseText); } catch {}
                for (const key in errors) {
                    if (Object.prototype.hasOwnProperty.call(errors, key)) {
                        const fieldMap = {
                            name: 'deviceName', model: 'deviceModel', farm: 'deviceFarm',
                            serial_number: 'serialNumber', mac_address: 'macAddress', ip_address: 'ipAddress',
                            connection_type: 'connectionType', firmware_version: 'firmwareVersion',
                            installation_date: 'installationDate', last_maintenance: 'lastMaintenance',
                            maintenance_interval: 'maintenanceInterval',
                        };
                        const fieldId = fieldMap[key];
                        if (fieldId) showFieldError(fieldId, Array.isArray(errors[key]) ? errors[key][0] : errors[key]);
                    }
                }
                return;
            }
            let deviceId = null;
            try { deviceId = JSON.parse(responseText).id; } catch {}
            const zoneId = formData.get('zone');
            if (deviceId && zoneId) {
                const locationData = { device: deviceId, zone: zoneId };
                try {
                    await fetch(API.addDeviceLocation, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCookie('csrftoken')
                        },
                        body: JSON.stringify(locationData)
                    });
                } catch {}
            }
            overlay.remove();
            window.location.reload();
        } catch (error) {
            showFieldError('deviceName', 'Ошибка при добавлении устройства');
        }
    });

    // --- Заполнение селектов моделей и ферм ---
    fetchDeviceModels().then(models => {
        const modelSelect = form.querySelector('#deviceModel');
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });
    });
    fetchUserFarms().then(farms => {
        const farmSelect = form.querySelector('#deviceFarm');
        const farmIdToSlug = {};
        farms.forEach(item => {
            if (item.farm) {
                const option = document.createElement('option');
                option.value = item.farm.id;
                option.textContent = item.farm.name;
                farmSelect.appendChild(option);
                farmIdToSlug[item.farm.id] = item.farm_slug;
            }
        });
        farmSelect._idToSlug = farmIdToSlug;
    });

    // --- Сброс ошибок при изменении полей ---
    form.querySelectorAll('input, select').forEach(field => {
        field.addEventListener('input', () => {
            const fieldId = field.id;
            const errorDiv = form.querySelector(`#error-${fieldId}`);
            if (errorDiv) errorDiv.textContent = '';
            field.classList.remove('error-input');
        });
    });

    // --- Сборка и отображение модалки ---
    modal.appendChild(header);
    modal.appendChild(form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // --- Закрытие по клику на фон ---
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    // --- Вспомогательные функции ---
    function clearErrors() {
        form.querySelectorAll('.field-error').forEach(el => el.textContent = '');
        form.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
    }
    function showFieldError(fieldId, message) {
        const errorDiv = form.querySelector(`#error-${fieldId}`);
        const input = form.querySelector(`#${fieldId}`);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.color = '#ff4444';
        }
        if (input) input.classList.add('error-input');
    }
    function validateFormFields() {
        clearErrors();
        let valid = true;
        const requiredFields = [
            {id: 'deviceName', name: 'Название обязательно'},
            {id: 'deviceModel', name: 'Выберите модель'},
            {id: 'deviceFarm', name: 'Выберите ферму'},
            {id: 'serialNumber', name: 'Серийный номер обязателен'},
            {id: 'macAddress', name: 'MAC адрес обязателен'},
            {id: 'ipAddress', name: 'IP адрес обязателен'},
            {id: 'connectionType', name: 'Выберите тип подключения'}
        ];
        requiredFields.forEach(field => {
            const el = form.querySelector(`#${field.id}`);
            if (el && (!el.value || el.value === '')) {
                showFieldError(field.id, field.name);
                valid = false;
            }
        });
        return valid;
    }
}

// =====================
// Инициализация
// =====================
document.addEventListener('DOMContentLoaded', () => {
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    if (addDeviceBtn) {
        addDeviceBtn.addEventListener('click', showAddDeviceModal);
    }
});

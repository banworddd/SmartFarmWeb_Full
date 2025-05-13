document.addEventListener('DOMContentLoaded', () => {
    // === Константы и сопоставления ===
    const zoneTypeIcons = {
        'greenhouse': 'fas fa-warehouse',
        'field': 'fas fa-seedling',
        'other': 'fas fa-map-marker-alt'
    };

    // === DOM элементы ===
    const zoneTabsList = document.getElementById('zoneTabsList');
    let currentZoneId = null;

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

    // === Создание вкладки зоны ===
    const createZoneTab = (zone, isActive = false) => {
        const tab = document.createElement('div');
        tab.className = `zone-tab${isActive ? ' active' : ''}`;
        tab.dataset.zoneId = zone.id;
        
        const icon = document.createElement('i');
        icon.className = zoneTypeIcons[zone.zone_type] || zoneTypeIcons.other;
        
        const name = document.createElement('span');
        name.textContent = zone.name;
        
        tab.appendChild(icon);
        tab.appendChild(name);
        
        tab.addEventListener('click', () => switchZone(zone));
        
        return tab;
    };

    // === Переключение зоны ===
    const switchZone = (zone) => {
        if (currentZoneId === zone.id) return;
        
        // Обновляем активную вкладку
        document.querySelectorAll('.zone-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.zoneId === zone.id.toString());
        });
        
        currentZoneId = zone.id;
        
        // Генерируем событие смены зоны
        document.dispatchEvent(new CustomEvent('zoneChanged', {
            detail: {
                id: zone.id,
                name: zone.name
            }
        }));
    };

    // === Загрузка зон фермы ===
    const loadFarmZones = async (farmName) => {
        try {
            const response = await fetch(`/api/v1/devices/org_farms_zones/?farm=${farmName}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Ошибка загрузки зон');

            const zones = await response.json();
            
            if (!zones.length) {
                if (zoneTabsList) {
                    zoneTabsList.innerHTML = `
                        <div class="zone-tab no-zones-tab">
                            <i class="fas fa-map-marker-alt"></i>
                            <div>
                                <div class="main-text">Нет доступных зон</div>
                                <div class="sub-text">В этой ферме нет зон</div>
                            </div>
                        </div>
                    `;
                }
                // Очищаем устройства
                const devicesContainer = document.getElementById('devicesContainer');
                if (devicesContainer) {
                    devicesContainer.innerHTML = `
                        <div class="device-card empty-device-card">
                            <i class="fas fa-microchip"></i>
                            <div class="main-text">Нет доступных устройств</div>
                            <div class="sub-text">В этой зоне нет устройств</div>
                        </div>
                    `;
                }
                return;
            }

            // Очищаем список вкладок
            if (zoneTabsList) {
                zoneTabsList.innerHTML = '';
                
                // Добавляем вкладки
                zones.forEach((zone, index) => {
                    const tab = createZoneTab(zone, index === 0);
                    zoneTabsList.appendChild(tab);
                });
                
                // Активируем первую зону
                if (zones.length > 0) {
                    switchZone(zones[0]);
                }
                if (window.enableTabsDragScroll) window.enableTabsDragScroll();
            }
        } catch (error) {
            console.error('Error:', error);
            if (zoneTabsList) {
                zoneTabsList.innerHTML = `
                    <div class="empty-state-container">
                        <div class="error-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <h3>Ошибка загрузки</h3>
                            <p>Не удалось загрузить список зон</p>
                        </div>
                    </div>
                `;
            }
        }
    };

    // === Обработка событий ===
    document.addEventListener('farmChanged', (event) => {
        const farmSlug = event.detail.slug;
        if (zoneTabsList) zoneTabsList.innerHTML = '';
        if (farmSlug) {
            loadFarmZones(farmSlug);
        }
    });

    // Очищаем зоны при смене организации
    document.addEventListener('orgChanged', () => {
        if (zoneTabsList) {
            zoneTabsList.innerHTML = '';
        }
        currentZoneId = null;
    });

    // Очищаем зоны если нет ферм
    document.addEventListener('noFarmsInOrg', () => {
        if (zoneTabsList) {
            zoneTabsList.innerHTML = '';
        }
        currentZoneId = null;
    });

    // === Инициализация ===
    if (zoneTabsList) {
        // Очищаем список зон при первой загрузке
        zoneTabsList.innerHTML = `
            <div class="empty-state-container">
                <div class="no-zones">
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>Выберите ферму</h3>
                    <p>Для просмотра зон выберите ферму выше</p>
                </div>
            </div>
        `;
    }
});

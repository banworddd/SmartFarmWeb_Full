document.addEventListener('DOMContentLoaded', () => {
    // === DOM элементы ===
    const farmTabsList = document.getElementById('farmTabsList');
    let currentFarmId = null;

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

    // === Создание вкладки фермы ===
    const createFarmTab = (farm, isActive = false) => {
        const tab = document.createElement('div');
        tab.className = `farm-tab${isActive ? ' active' : ''}`;
        tab.dataset.farmId = farm.id;
        tab.dataset.farmSlug = farm.slug;
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-tractor';
        
        const name = document.createElement('span');
        name.textContent = farm.name;
        
        tab.appendChild(icon);
        tab.appendChild(name);
        
        tab.addEventListener('click', () => switchFarm(farm));
        
        return tab;
    };

    // === Переключение фермы ===
    const switchFarm = (farm) => {
        if (currentFarmId === farm.id) return;
        
        // Обновляем активную вкладку
        document.querySelectorAll('.farm-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.farmId === farm.id.toString());
        });
        
        currentFarmId = farm.id;
        
        // Генерируем событие смены фермы
        document.dispatchEvent(new CustomEvent('farmChanged', {
            detail: {
                id: farm.id,
                slug: farm.slug
            }
        }));
    };

    // === Загрузка ферм организации ===
    const loadOrganizationFarms = async (orgSlug) => {
        currentFarmId = null; 
        if (farmTabsList) farmTabsList.innerHTML = '';
        try {
            const response = await fetch(`/api/v1/devices/org_farms/?organization=${orgSlug}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Ошибка загрузки ферм');

            const farms = await response.json();
            
            if (!farms.length) {
                if (farmTabsList) {
                    farmTabsList.innerHTML = `
                        <div class="farm-tab no-farms-tab">
                            <i class="fas fa-tractor"></i>
                            <div>
                                <div class="main-text">Нет доступных ферм</div>
                                <div class="sub-text">В этой организации нет ферм</div>
                            </div>
                        </div>
                    `;
                }
                // Очищаем зоны и устройства
                document.dispatchEvent(new CustomEvent('noFarmsInOrg'));
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
                return false;
            }

            // Очищаем список вкладок
            if (farmTabsList) {
                farmTabsList.innerHTML = '';
                
                // Добавляем вкладки
                farms.forEach((farm, index) => {
                    const tab = createFarmTab(farm, index === 0);
                    farmTabsList.appendChild(tab);
                });
                
                // Активируем первую ферму
                if (farms.length > 0) {
                    switchFarm(farms[0]);
                }
                if (window.enableTabsDragScroll) window.enableTabsDragScroll();
            }
            return true;
        } catch (error) {
            console.error('Error:', error);
            if (farmTabsList) {
                farmTabsList.innerHTML = `
                    <div class="empty-state-container">
                        <div class="error-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <h3>Ошибка загрузки</h3>
                            <p>Не удалось загрузить список ферм</p>
                        </div>
                    </div>
                `;
            }
            document.dispatchEvent(new CustomEvent('noFarmsInOrg'));
            return false;
        }
    };

    // Экспортируем функцию в глобальный объект window
    window.loadOrganizationFarms = loadOrganizationFarms;

    // === Обработка событий ===
    document.addEventListener('orgChanged', (event) => {
        const orgSlug = event.detail.slug;
        if (orgSlug) {
            loadOrganizationFarms(orgSlug);
        }
    });

    // === Инициализация ===
    if (farmTabsList) {
        // Очищаем список ферм при первой загрузке
        farmTabsList.innerHTML = `
            <div class="empty-state-container">
                <div class="no-farms">
                    <i class="fas fa-tractor"></i>
                    <h3>Выберите организацию</h3>
                    <p>Для просмотра ферм выберите организацию выше</p>
                </div>
            </div>
        `;
    }
});

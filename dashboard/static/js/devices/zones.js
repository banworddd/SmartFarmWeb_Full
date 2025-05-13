class ZonesManager {
    constructor(orgSlug, farmSlug) {
        this.orgSlug = orgSlug;
        this.farmSlug = farmSlug;
        this.zonesContainer = document.querySelector('.zones-container');
        this.loadZones();
    }

    async loadZones() {
        try {
            const response = await fetch(`/api/v1/devices/org_farms_zones/?farm=${this.farmSlug}`);
            const zones = await response.json();
            
            // Создаем вкладки для зон
            this.zonesContainer.innerHTML = `
                <ul class="nav nav-tabs" role="tablist">
                    ${zones.map((zone, index) => `
                        <li class="nav-item">
                            <a class="nav-link ${index === 0 ? 'active' : ''}" 
                               data-bs-toggle="tab" 
                               href="#zone-${zone.name}"
                               role="tab"
                               data-zone-name="${zone.name}">
                                ${zone.name}
                            </a>
                        </li>
                    `).join('')}
                </ul>
                <div class="tab-content">
                    ${zones.map((zone, index) => `
                        <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" 
                             id="zone-${zone.name}"
                             role="tabpanel">
                            <div class="devices-container">
                                <div class="spinner-border" role="status">
                                    <span class="visually-hidden">Загрузка устройств...</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Инициализируем менеджер устройств для первой зоны
            if (zones.length > 0) {
                new DevicesManager(this.orgSlug, this.farmSlug, zones[0].name);
            }

            // Добавляем обработчики переключения вкладок
            zones.forEach(zone => {
                const tab = this.zonesContainer.querySelector(`[data-zone-name="${zone.name}"]`);
                tab.addEventListener('shown.bs.tab', () => {
                    new DevicesManager(this.orgSlug, this.farmSlug, zone.name);
                });
            });
        } catch (error) {
            console.error('Error loading zones:', error);
            this.showError('Ошибка загрузки зон');
        }
    }

    showError(message) {
        this.zonesContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                ${message}
            </div>
        `;
    }
} 
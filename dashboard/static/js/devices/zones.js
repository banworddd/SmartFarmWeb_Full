class ZonesManager {
    constructor(orgSlug, farmSlug) {
        this.orgSlug = orgSlug;
        this.farmSlug = farmSlug;
        this.zonesContainer = document.querySelector(`#farm-${farmSlug} .zones-container`);
        this.loadZones();
    }

    async loadZones() {
        try {
            const response = await fetch(`/api/v1/DevicesPage/org_farms_zones/?farm=${this.farmSlug}`);
            const zones = await response.json();
            
            // Создаем вкладки для зон
            this.zonesContainer.innerHTML = `
                <ul class="nav nav-tabs" id="zonesTab-${this.farmSlug}" role="tablist">
                    ${zones.map((zone, index) => `
                        <li class="nav-item">
                            <a class="nav-link ${index === 0 ? 'active' : ''}" 
                               id="zone-${zone.id}-tab" 
                               data-bs-toggle="tab" 
                               href="#zone-${zone.id}" 
                               role="tab"
                               data-zone-id="${zone.id}">
                                ${zone.name}
                            </a>
                        </li>
                    `).join('')}
                </ul>
                <div class="tab-content" id="zonesTabContent-${this.farmSlug}">
                    ${zones.map((zone, index) => `
                        <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" 
                             id="zone-${zone.id}" 
                             role="tabpanel">
                            <div class="mt-3">
                                <div class="devices-container">
                                    <div class="spinner-border" role="status">
                                        <span class="visually-hidden">Загрузка устройств...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Инициализируем менеджер устройств для первой зоны
            if (zones.length > 0) {
                new DevicesManager(this.orgSlug, this.farmSlug, zones[0].id);
            }

            // Добавляем обработчики переключения вкладок
            zones.forEach(zone => {
                const tab = document.querySelector(`#zone-${zone.id}-tab`);
                tab.addEventListener('shown.bs.tab', () => {
                    new DevicesManager(this.orgSlug, this.farmSlug, zone.id);
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
class FarmsManager {
    constructor(orgSlug, farmsContainer) {
        this.orgSlug = orgSlug;
        this.farmsContainer = farmsContainer;
        this.loadFarms();
    }

    async loadFarms() {
        try {
            const response = await fetch(`/api/v1/devices/org_farms/?organization=${this.orgSlug}`);
            const farms = await response.json();
            
            // Создаем вкладки для ферм
            this.farmsContainer.innerHTML = `
                <ul class="nav nav-tabs" role="tablist">
                    ${farms.map((farm, index) => `
                        <li class="nav-item">
                            <a class="nav-link ${index === 0 ? 'active' : ''}" 
                               data-bs-toggle="tab" 
                               href="#farm-${farm.slug}"
                               role="tab"
                               data-farm-slug="${farm.slug}">
                                ${farm.name}
                            </a>
                        </li>
                    `).join('')}
                </ul>
                <div class="tab-content">
                    ${farms.map((farm, index) => `
                        <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" 
                             id="farm-${farm.slug}"
                             role="tabpanel">
                            <div class="zones-container">
                                <div class="spinner-border" role="status">
                                    <span class="visually-hidden">Загрузка зон...</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Инициализируем менеджер зон для первой фермы
            if (farms.length > 0) {
                new ZonesManager(this.orgSlug, farms[0].slug);
            }

            // Добавляем обработчики переключения вкладок
            farms.forEach(farm => {
                const tab = this.farmsContainer.querySelector(`[data-farm-slug="${farm.slug}"]`);
                tab.addEventListener('shown.bs.tab', () => {
                    new ZonesManager(this.orgSlug, farm.slug);
                });
            });
        } catch (error) {
            console.error('Error loading farms:', error);
            this.showError('Ошибка загрузки ферм');
        }
    }

    showError(message) {
        this.farmsContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                ${message}
            </div>
        `;
    }
} 
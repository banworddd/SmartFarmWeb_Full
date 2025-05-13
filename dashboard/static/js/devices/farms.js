class FarmsManager {
    constructor(orgSlug) {
        this.orgSlug = orgSlug;
        this.farmsContainer = document.querySelector(`#org-${orgSlug} .farms-container`);
        this.loadFarms();
    }

    async loadFarms() {
        try {
            const response = await fetch(`/api/v1/DevicesPage/org_farms/?organization=${this.orgSlug}`);
            const farms = await response.json();
            
            // Создаем вкладки для ферм
            this.farmsContainer.innerHTML = `
                <ul class="nav nav-tabs" id="farmsTab-${this.orgSlug}" role="tablist">
                    ${farms.map((farm, index) => `
                        <li class="nav-item">
                            <a class="nav-link ${index === 0 ? 'active' : ''}" 
                               id="farm-${farm.slug}-tab" 
                               data-bs-toggle="tab" 
                               href="#farm-${farm.slug}" 
                               role="tab"
                               data-farm-slug="${farm.slug}">
                                ${farm.name}
                            </a>
                        </li>
                    `).join('')}
                </ul>
                <div class="tab-content" id="farmsTabContent-${this.orgSlug}">
                    ${farms.map((farm, index) => `
                        <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" 
                             id="farm-${farm.slug}" 
                             role="tabpanel">
                            <div class="mt-3">
                                <div class="zones-container">
                                    <div class="spinner-border" role="status">
                                        <span class="visually-hidden">Загрузка зон...</span>
                                    </div>
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
                const tab = document.querySelector(`#farm-${farm.slug}-tab`);
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
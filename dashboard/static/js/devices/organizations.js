class OrganizationsManager {
    constructor() {
        this.organizationsTab = document.getElementById('organizationsTab');
        this.organizationsContent = document.getElementById('organizationsTabContent');
        this.loadOrganizations();
    }

    async loadOrganizations() {
        try {
            const response = await fetch('/api/v1/user_pages/user_organizations/');
            const userOrgs = await response.json();
            
            // Удаляем вкладку загрузки
            this.organizationsTab.innerHTML = '';
            this.organizationsContent.innerHTML = '';

            // Создаем вкладки для каждой организации
            userOrgs.forEach((userOrg, index) => {
                const org = userOrg.organization;
                this.createOrganizationTab(org, index === 0);
            });

            // Инициализируем первую вкладку
            const firstTab = this.organizationsTab.querySelector('.nav-link');
            if (firstTab) {
                const tab = new bootstrap.Tab(firstTab);
                tab.show();
            }
        } catch (error) {
            console.error('Error loading organizations:', error);
            this.showError('Ошибка загрузки организаций');
        }
    }

    createOrganizationTab(org, isActive) {
        // Создаем вкладку
        const tab = document.createElement('li');
        tab.className = 'nav-item';
        tab.innerHTML = `
            <a class="nav-link ${isActive ? 'active' : ''}" 
               data-bs-toggle="tab" 
               href="#org-${org.slug}"
               role="tab"
               data-org-slug="${org.slug}">
                ${org.name}
            </a>
        `;
        this.organizationsTab.appendChild(tab);

        // Создаем контент вкладки
        const content = document.createElement('div');
        content.className = `tab-pane fade ${isActive ? 'show active' : ''}`;
        content.id = `org-${org.slug}`;
        content.innerHTML = `
            <div class="farms-container">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Загрузка ферм...</span>
                </div>
            </div>
        `;
        this.organizationsContent.appendChild(content);

        // Инициализируем загрузку ферм для этой организации
        if (isActive) {
            new FarmsManager(org.slug, content.querySelector('.farms-container'));
        }

        // Добавляем обработчик переключения вкладок
        tab.querySelector('a').addEventListener('shown.bs.tab', (event) => {
            const orgSlug = event.target.dataset.orgSlug;
            const farmsContainer = content.querySelector('.farms-container');
            new FarmsManager(orgSlug, farmsContainer);
        });
    }

    showError(message) {
        this.organizationsContent.innerHTML = `
            <div class="alert alert-danger" role="alert">
                ${message}
            </div>
        `;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new OrganizationsManager();
}); 
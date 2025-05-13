class OrganizationsManager {
    constructor() {
        this.organizationsTab = document.getElementById('organizationsTab');
        this.organizationsContent = document.getElementById('organizationsTabContent');
        this.loadOrganizations();
    }

    async loadOrganizations() {
        try {
            const response = await fetch('/api/v1/user_pages/user_organizations/');
            const organizations = await response.json();
            
            // Удаляем вкладку загрузки
            this.organizationsTab.innerHTML = '';
            this.organizationsContent.innerHTML = '';

            // Создаем вкладки для каждой организации
            organizations.forEach((org, index) => {
                this.createOrganizationTab(org, index === 0);
            });
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
               id="org-${org.slug}-tab" 
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
            <div class="mt-3">
                <div class="farms-container">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Загрузка ферм...</span>
                    </div>
                </div>
            </div>
        `;
        this.organizationsContent.appendChild(content);

        // Инициализируем менеджер ферм для этой организации
        if (isActive) {
            new FarmsManager(org.slug);
        }

        // Добавляем обработчик переключения вкладок
        tab.querySelector('a').addEventListener('shown.bs.tab', (event) => {
            const orgSlug = event.target.dataset.orgSlug;
            new FarmsManager(orgSlug);
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
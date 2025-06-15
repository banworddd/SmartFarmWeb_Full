document.addEventListener('DOMContentLoaded', () => {
    // === Константы и сопоставления ===
    const orgTypeNames = {
        'supplier': 'Поставщик',
        'partner': 'Партнер',
        'government': 'Государственная',
        'other': 'Другое'
    };

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

    // === Загрузка данных организации ===
    const loadOrganizationData = () => {
        fetch(`/api/v1/farm/ext_org/?slug=${FARM_SLUG}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            return response.json();
        })
        .then(data => {
            // Обновляем поля организации
            const orgNameValue = document.getElementById('orgNameValue');
            if (orgNameValue) {
                // Создаем ссылку на страницу организации
                const orgLink = document.createElement('a');
                orgLink.href = `/dashboard/organizations/${data.slug}/`;
                orgLink.className = 'org-link';
                orgLink.textContent = data.name;
                orgNameValue.textContent = '';
                orgNameValue.appendChild(orgLink);
            }
            
            const orgAddressValue = document.getElementById('orgAddressValue');
            if (orgAddressValue) orgAddressValue.textContent = data.address || 'Адрес не указан';
            
            const orgDescriptionValue = document.getElementById('orgDescriptionValue');
            if (orgDescriptionValue) orgDescriptionValue.textContent = data.description || 'Нет описания';
            
            const orgTypeValue = document.getElementById('orgTypeValue');
            if (orgTypeValue) {
                orgTypeValue.textContent = orgTypeNames[data.type] || data.type;
                const orgTypeBadge = orgTypeValue.closest('.org-field').querySelector('.farm-type');
                if (orgTypeBadge) {
                    orgTypeBadge.className = 'farm-type badge-toggle';
                    if (data.type) orgTypeBadge.classList.add(`type-${data.type}`);
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const errorMessage = 'Не удалось загрузить данные организации';
            const elements = [
                'orgNameValue',
                'orgAddressValue',
                'orgDescriptionValue',
                'orgTypeValue'
            ];
            elements.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.textContent = errorMessage;
            });
        });
    };

    // === Раскрывающиеся бейджи (toggle) ===
    document.querySelectorAll('.badge-toggle').forEach(badge => {
        badge.addEventListener('click', function() {
            this.classList.toggle('expanded');
        });
        badge.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.classList.toggle('expanded');
            }
        });
    });

    // Загружаем данные при загрузке страницы
    if (document.getElementById('orgNameValue')) {
        loadOrganizationData();
    }
});

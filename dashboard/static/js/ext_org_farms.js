document.addEventListener('DOMContentLoaded', () => {
    // === Константы и сопоставления ===
    const roleNames = {
        owner: 'Владелец',
        admin: 'Администратор',
        manager: 'Менеджер',
        technician: 'Техник',
        viewer: 'Наблюдатель'
    };
    const roleIcons = {
        owner: 'fas fa-crown',
        admin: 'fas fa-user-shield',
        manager: 'fas fa-user-cog',
        technician: 'fas fa-tools',
        viewer: 'fas fa-eye'
    };

    // === DOM элементы ===
    const farmsList = document.getElementById('farmsList');
    const createBtn = document.getElementById('createFarmBtn');
    const modal = document.getElementById('createFarmModal');
    const closeBtn = document.getElementById('closeCreateFarmModal');
    const form = document.getElementById('createFarmForm');
    const errorDiv = document.getElementById('createFarmError');

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

    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // === Создание карточки фермы ===
    const createFarmCard = farm => {
        const isLinked = !!farm.slug;
        const roleBadge = farm.role
            ? `<span class="farm-role badge-toggle farm-role-badge role-${farm.role}" tabindex="0">
                    <i class="${roleIcons[farm.role] || 'fas fa-user'}"></i>
                    <span class="role-label">${roleNames[farm.role] || farm.role}</span>
               </span>`
            : '';

        if (!isLinked) {
            return `
                <div class="farm-card empty-state-card">
                    <div class="farm-user-center" style="width:100%;justify-content:center;">
                        <div class="farm-names" style="width:100%;text-align:center;">
                            <span class="farm-name">${farm.name || 'Без названия'}</span>
                            ${farm.description ? `<span class="farm-description">${farm.description}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        return `<a href="/dashboard/farms/${farm.slug}/" class="farm-card farm-card--linked">
            <div class="farm-header-block" style="flex-shrink:0;">
                <div class="farm-header" style="position:relative;">
                    <div class="farm-header-main">
                        <span class="farm-name">${farm.name || 'Без названия'}</span>
                        ${roleBadge}
                    </div>
                    ${farm.description ? `<div class="farm-description">${farm.description}</div>` : ''}
                </div>
            </div>
            <div style="flex:1 1 auto;"></div>
            <div class="farm-divider"></div>
            <div class="farm-meta">
                ${farm.owner_full_name ? `
                    <div class="farm-meta-item">
                        <i class="fas fa-user farm-meta-icon"></i>
                        <span>${farm.owner_full_name}</span>
                    </div>
                ` : ''}
                ${farm.updated_at ? `
                    <div class="farm-meta-item">
                        <i class="fas fa-calendar-alt farm-meta-icon"></i>
                        <span>${farm.updated_at}</span>
                    </div>
                ` : ''}
            </div>
        </a>`;
    };

    // === Загрузка ферм организации ===
    const loadOrganizationFarms = async () => {
        const nameFilter = document.getElementById('farmNameFilter')?.value;
        const roleFilter = document.getElementById('farmRoleFilter')?.value;

        let url = `/api/v1/ext_org/farms/?organization=${ORGANIZATION_SLUG}`;
        if (nameFilter) url += `&search=${nameFilter}`;
        if (roleFilter) url += `&role=${roleFilter}`;
        if (currentFarmOrdering) url += `&ordering=${currentFarmOrdering}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                credentials: 'include'
            });
            const farms = await response.json();

            if (!farmsList) return;

            if (farms.length) {
                farmsList.innerHTML = farms.map(farm => createFarmCard(farm)).join('');
            } else {
                farmsList.innerHTML = `
                    <div class="farm-card empty-state-card">
                        <div class="farm-user-center">
                            <i class="fas fa-tractor empty-state-icon"></i>
                            <div class="farm-names">
                                <span class="farm-name">Нет ферм</span>
                                <span class="farm-description">Попробуйте изменить параметры фильтрации</span>
                            </div>
                        </div>
                    </div>`;
            }
        } catch (error) {
            console.error('Error:', error);
            if (farmsList) {
                farmsList.innerHTML = `
                    <div class="farm-card">
                        <div class="farm-header" style="position:relative;">
                            <div class="farm-header-main">
                                <span class="farm-name">Не удалось загрузить список ферм</span>
                            </div>
                        </div>
                    </div>`;
            }
        }
    };

    // === Обработчики событий ===
    const initEventListeners = () => {
        const farmNameFilter = document.getElementById('farmNameFilter');
        const farmRoleFilter = document.getElementById('farmRoleFilter');
        const sortArrows = document.querySelectorAll('.sort-arrow');

        if (farmNameFilter) {
            farmNameFilter.addEventListener('input', debounce(loadOrganizationFarms, 300));
        }
        if (farmRoleFilter) {
            farmRoleFilter.addEventListener('change', loadOrganizationFarms);
        }
        if (sortArrows) {
            sortArrows.forEach(btn => {
                btn.addEventListener('click', e => {
                    e.preventDefault();
                    currentFarmOrdering = btn.dataset.ordering;
                    sortArrows.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    loadOrganizationFarms();
                });
            });
        }

        document.addEventListener('click', function(e) {
            const badge = e.target.closest('.farm-role-badge');
            if (badge) {
                e.preventDefault();
                badge.classList.toggle('expanded');
            }
        });
    };

    // === Модальное окно создания фермы ===
    let currentFarmOrdering = '';

    if (typeof USER_ROLE !== 'undefined' && USER_ROLE === 'admin' && createBtn) {
        createBtn.style.display = '';
    }

    if (createBtn && modal) {
        createBtn.onclick = () => { modal.style.display = 'block'; };
    }
    if (closeBtn && modal) {
        closeBtn.onclick = () => { modal.style.display = 'none'; };
    }
    window.addEventListener('click', function(event) {
        if (event.target === modal) modal.style.display = 'none';
    });

    if (form) {
        form.onsubmit = async function(e) {
            e.preventDefault();
            const name = form.elements['name'].value.trim();
            const description = form.elements['description'].value.trim();
            errorDiv.style.display = 'none';

            try {
                const response = await fetch(`/api/v1/ext_org/create_farm/?organization=${ORGANIZATION_SLUG}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        name,
                        description,
                        owner: USER,
                        organization: ORG_ID
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    let errorMsg = data.detail || data.error || '';
                    if (!errorMsg && typeof data === 'object') {
                        errorMsg = Object.values(data).flat().join('; ');
                    }
                    throw new Error(errorMsg || 'Ошибка создания фермы');
                }

                modal.style.display = 'none';
                form.reset();
                loadOrganizationFarms();
            } catch (err) {
                errorDiv.textContent = err.message;
                errorDiv.style.display = 'block';
            }
        };
    }

    // === Инициализация ===
    if (document.getElementById('farmsList')) {
        loadOrganizationFarms();
        initEventListeners();
    }
}); 
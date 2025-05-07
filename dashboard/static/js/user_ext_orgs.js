document.addEventListener('DOMContentLoaded', () => {
    const orgsList = document.getElementById('orgsList');
    const sortSection = document.querySelector('.sort-buttons');
    const roleFilter = document.getElementById('roleFilter');
    const nameFilter = document.getElementById('nameFilter');
    const statusFilter = document.getElementById('statusFilter');
    const organizationTypeFilter = document.getElementById('organizationTypeFilter');
    let currentOrdering = '';

    const roleIcons = {
        'admin': 'fas fa-user-shield',
        'manager': 'fas fa-user-cog',
        'member': 'fas fa-user',
        'guest': 'fas fa-user-tag'
    };
    const roleNames = {
        'admin': 'Администратор',
        'manager': 'Менеджер',
        'member': 'Сотрудник',
        'guest': 'Гость'
    };
    const statusIcons = {
        'approved': 'fas fa-check-circle',
        'pending': 'fas fa-hourglass-half',
        'rejected': 'fas fa-times-circle'
    };
    const statusNames = {
        'approved': 'Одобрено',
        'pending': 'В ожидании',
        'rejected': 'Отклонено'
    };
    const typeIcons = {
        'supplier': 'fas fa-truck',
        'partner': 'fas fa-handshake',
        'government': 'fas fa-landmark',
        'other': 'fas fa-building'
    };
    const typeNames = {
        'supplier': 'Поставщик',
        'partner': 'Партнер',
        'government': 'Государственная',
        'other': 'Другое'
    };

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
        const [datePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('.');
        return new Date(year, month - 1, day).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const createOrgCard = org => {
        const cardHtml = `
            <div class="farm-card" data-org-id="${org.id}">
                <div class="farm-header">
                    <h3 class="farm-name">${org.organization.name}</h3>
                    <div class="farm-badges">
                        <span class="farm-role role-${org.role}">
                            <i class="${roleIcons[org.role] || 'fas fa-user'}"></i>
                            <span class="role-label">${roleNames[org.role] || org.role}</span>
                        </span>
                        <span class="farm-status status-${org.status}">
                            <i class="${statusIcons[org.status] || 'fas fa-info-circle'}"></i>
                            <span class="status-label">${statusNames[org.status] || org.status}</span>
                        </span>
                        <span class="farm-type type-${org.organization.type}">
                            <i class="${typeIcons[org.organization.type] || 'fas fa-building'}"></i>
                            <span class="type-label">${typeNames[org.organization.type] || org.organization.type}</span>
                        </span>
                    </div>
                </div>
                <p class="farm-description">${org.organization.description || 'Нет описания'}</p>
                <div class="farm-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${org.organization.address || 'Нет адреса'}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${formatDate(org.updated_at)}</span>
                </div>
            </div>
        `;
        return `<a href="/dashboard/organizations/${org.organization.slug}/" class="farm-card-link">${cardHtml}</a>`;
    };

    const loadOrganizations = () => {
        orgsList.classList.add('updating');
        const params = new URLSearchParams();
        if (roleFilter.value) params.append('role', roleFilter.value);
        if (nameFilter.value) params.append('organization_name', nameFilter.value);
        if (statusFilter.value) params.append('status', statusFilter.value);
        if (organizationTypeFilter.value) params.append('organization_type', organizationTypeFilter.value);
        if (currentOrdering) params.append('ordering', currentOrdering);
        fetch(`/api/v1/user_pages/user_organizations/?${params.toString()}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            const noOrgsMessage = document.querySelector('.no-orgs');
            if (data.length === 0) {
                orgsList.innerHTML = '';
                noOrgsMessage.style.display = 'flex';
            } else {
                orgsList.innerHTML = data.map(createOrgCard).join('');
                noOrgsMessage.style.display = 'none';
            }
            setTimeout(() => orgsList.classList.remove('updating'), 50);
        })
        .catch(error => {
            console.error('Error:', error);
            orgsList.innerHTML = '';
            const errorState = document.querySelector('.error-state');
            if (errorState) errorState.style.display = 'flex';
            orgsList.classList.remove('updating');
        });
    };

    // Фильтры
    roleFilter.addEventListener('change', loadOrganizations);
    statusFilter.addEventListener('change', loadOrganizations);
    organizationTypeFilter.addEventListener('change', loadOrganizations);
    let searchTimeout;
    nameFilter.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadOrganizations, 500);
    });

    // Сортировка
    if (sortSection) {
        sortSection.querySelectorAll('.sort-badge').forEach(badge => {
            badge.addEventListener('click', e => {
                if (!e.target.closest('.sort-arrow')) {
                    badge.classList.toggle('expanded');
                }
            });
            badge.querySelectorAll('.sort-arrow').forEach(arrow => {
                arrow.addEventListener('click', e => {
                    e.stopPropagation();
                    sortSection.querySelectorAll('.sort-arrow').forEach(a => a.classList.remove('active'));
                    arrow.classList.add('active');
                    const sortField = badge.dataset.sort;
                    const direction = arrow.dataset.direction;
                    currentOrdering = direction === 'desc' ? `-${sortField}` : sortField;
                    loadOrganizations();
                });
            });
        });
    }

    // Открытие/закрытие бейджей
    orgsList.addEventListener('click', e => {
        const badge = e.target.closest('.farm-badges span');
        if (badge) {
            e.preventDefault();
            badge.classList.toggle('expanded');
        }
    });

    // Первоначальная загрузка
    loadOrganizations();
});
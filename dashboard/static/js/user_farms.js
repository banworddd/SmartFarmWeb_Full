document.addEventListener('DOMContentLoaded', () => {
    const farmsList = document.getElementById('farmsList');
    const roleFilter = document.getElementById('roleFilter');
    const nameFilter = document.getElementById('nameFilter');
    const orgFilter = document.getElementById('orgFilter');
    const orderingSelect = document.getElementById('orderingSelect');
    const allOrganizations = new Set();

    const roleIcons = {
        'owner': 'fas fa-crown',
        'admin': 'fas fa-user-shield',
        'manager': 'fas fa-user-tie',
        'technician': 'fas fa-user-cog',
        'viewer': 'fas fa-eye'
    };

    const roleNames = {
        'owner': 'Владелец',
        'admin': 'Администратор',
        'manager': 'Менеджер',
        'technician': 'Техник',
        'viewer': 'Наблюдатель'
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

    const createFarmCard = farm => {
        const roleIcon = roleIcons[farm.role] || 'fas fa-user';
        const roleLabel = roleNames[farm.role] || farm.role;
        
        const cardHtml = `
            <div class="farm-card" data-farm-id="${farm.id}">
                <div class="farm-header">
                    <h3 class="farm-name">${farm.farm.name}</h3>
                    <div class="farm-badges">
                        <span class="farm-role role-${farm.role}">
                            <i class="${roleIcon}"></i>
                            <span class="role-label">${roleLabel}</span>
                        </span>
                    </div>
                </div>
                <p class="farm-description">${farm.farm.description || 'Нет описания'}</p>
                <div class="farm-meta">
                    <span><i class="fas fa-building"></i> ${farm.farm.organization_name || 'Без организации'}</span>
                    <span><i class="fas fa-user-shield"></i> ${farm.farm.owner_full_name}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${formatDate(farm.joined_at)}</span>
                </div>
            </div>
        `;
        
        return farm.farm_slug 
            ? `<a href="/dashboard/farms/${farm.farm_slug}/" class="farm-card-link">${cardHtml}</a>`
            : cardHtml;
    };

    const updateOrganizationFilter = organizations => {
        if (organizations.size === 0) return;
        
        const selectedOrg = orgFilter.value;
        orgFilter.innerHTML = '<option value="">Все организации</option>';
        
        organizations.forEach(org => {
            const option = document.createElement('option');
            option.value = org;
            option.textContent = org;
            orgFilter.appendChild(option);
        });
        
        if (selectedOrg) orgFilter.value = selectedOrg;
    };

    const loadFarms = () => {
        farmsList.classList.add('updating');
        
        const params = new URLSearchParams();
        if (roleFilter.value) params.append('role', roleFilter.value);
        if (nameFilter.value) params.append('farm_name', nameFilter.value);
        if (orgFilter.value) params.append('organization_name', orgFilter.value);
        if (orderingSelect?.value) params.append('ordering', orderingSelect.value);

        fetch(`/api/v1/user_pages/user_farms/?${params.toString()}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            const noFarmsMessage = document.querySelector('.no-farms');
            let filteredData = orgFilter.value 
                ? data.filter(farm => farm.farm.organization_name === orgFilter.value)
                : data;

            if (filteredData.length === 0) {
                farmsList.innerHTML = '';
                noFarmsMessage.style.display = 'flex';
            } else {
                if (allOrganizations.size === 0) {
                    data.forEach(farm => {
                        if (farm.farm.organization_name) {
                            allOrganizations.add(farm.farm.organization_name);
                        }
                    });
                    updateOrganizationFilter(allOrganizations);
                }

                farmsList.innerHTML = filteredData.map(createFarmCard).join('');
                noFarmsMessage.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            farmsList.innerHTML = '';
            const errorState = document.querySelector('.error-state');
            if (errorState) errorState.style.display = 'flex';
        })
        .finally(() => {
            setTimeout(() => farmsList.classList.remove('updating'), 50);
        });
    };

    const handleSort = (badge, direction) => {
        const sortField = badge.dataset.sort;
        const ordering = direction === 'desc' ? `-${sortField}` : sortField;
        
        const params = new URLSearchParams();
        if (roleFilter.value) params.append('role', roleFilter.value);
        if (nameFilter.value) params.append('farm_name', nameFilter.value);
        if (orgFilter.value) params.append('organization_name', orgFilter.value);
        params.append('ordering', ordering);

        fetch(`/api/v1/user_pages/user_farms/?${params.toString()}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            const noFarmsMessage = document.querySelector('.no-farms');
            let filteredData = orgFilter.value 
                ? data.filter(farm => farm.farm.organization_name === orgFilter.value)
                : data;

            if (filteredData.length === 0) {
                farmsList.innerHTML = '';
                noFarmsMessage.style.display = 'flex';
            } else {
                if (allOrganizations.size === 0) {
                    data.forEach(farm => {
                        if (farm.farm.organization_name) {
                            allOrganizations.add(farm.farm.organization_name);
                        }
                    });
                    updateOrganizationFilter(allOrganizations);
                }

                farmsList.innerHTML = filteredData.map(createFarmCard).join('');
                noFarmsMessage.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            farmsList.innerHTML = '';
            const errorState = document.querySelector('.error-state');
            if (errorState) errorState.style.display = 'flex';
        });
    };

    roleFilter.addEventListener('change', loadFarms);
    orgFilter.addEventListener('change', loadFarms);
    if (orderingSelect) orderingSelect.addEventListener('change', loadFarms);

    let searchTimeout;
    nameFilter.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadFarms, 500);
    });

    document.querySelectorAll('.sort-badge').forEach(badge => {
        badge.addEventListener('click', e => {
            if (!e.target.closest('.sort-arrow')) {
                badge.classList.toggle('expanded');
            }
        });

        badge.querySelectorAll('.sort-arrow').forEach(arrow => {
            arrow.addEventListener('click', e => {
                e.stopPropagation();
                document.querySelectorAll('.sort-arrow').forEach(a => a.classList.remove('active'));
                arrow.classList.add('active');
                handleSort(badge, arrow.dataset.direction);
            });
        });
    });

    farmsList.addEventListener('click', e => {
        const badge = e.target.closest('.farm-role');
        if (badge) {
            e.preventDefault();
            e.stopPropagation();
            badge.classList.toggle('expanded');
        }
    });

    loadFarms();
});

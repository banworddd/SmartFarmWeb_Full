document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const orgsList = document.getElementById('orgsList');
    const addOrgBtn = document.getElementById('addOrgBtn');
    const addOrgModal = document.getElementById('addOrgModal');
    const closeModal = document.querySelector('.close-modal');
    const addOrgForm = document.getElementById('addOrgForm');

    // Элементы фильтров
    const roleFilter = document.getElementById('roleFilter');
    const nameFilter = document.getElementById('nameFilter');
    const statusFilter = document.getElementById('statusFilter');
    const organizationTypeFilter = document.getElementById('organizationTypeFilter');

    // Загрузка данных организаций с учетом фильтров
    function loadOrganizations() {
        // Добавляем класс обновления
        orgsList.classList.add('updating');

        // Формируем URL с параметрами фильтрации
        const params = new URLSearchParams();
        if (roleFilter.value) params.append('role', roleFilter.value);
        if (nameFilter.value) params.append('organization_name', nameFilter.value);
        if (statusFilter.value) params.append('status', statusFilter.value);
        if (organizationTypeFilter.value) params.append('organization_type', organizationTypeFilter.value);

        const url = `/api/v1/user_organizations/?${params.toString()}`;
        console.log('Отправляем запрос:', url);

        fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            console.log('Получены данные:', data);
            const noOrgsMessage = document.querySelector('.no-orgs');

            if (data.length === 0) {
                orgsList.innerHTML = '';
                noOrgsMessage.style.display = 'flex';
            } else {
                orgsList.innerHTML = '';
                data.forEach(org => {
                    orgsList.innerHTML += createOrgCard(org);
                });
                noOrgsMessage.style.display = 'none';
            }

            // Удаляем класс обновления после небольшой задержки
            setTimeout(() => {
                orgsList.classList.remove('updating');
            }, 50);
        })
        .catch(error => {
            console.error('Error:', error);
            orgsList.innerHTML = '';
            const errorState = document.querySelector('.error-state');
            if (errorState) {
                errorState.style.display = 'flex';
            }
            orgsList.classList.remove('updating');
        });
    }

    // Управление модальным окном
    function showModal() {
        addOrgModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        addOrgModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Обработчики событий
    addOrgBtn.addEventListener('click', showModal);
    closeModal.addEventListener('click', hideModal);

    window.addEventListener('click', function(e) {
        if (e.target === addOrgModal) hideModal();
    });

    // Обработка формы
    addOrgForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('orgName').value,
            description: document.getElementById('orgDescription').value
        };

        fetch('/api/v1/organizations/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(formData),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            hideModal();
            addOrgForm.reset();
            loadOrganizations();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ошибка: ' + error.message);
        });
    });

    // Получение CSRF токена
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Обработчики событий для фильтров
    roleFilter.addEventListener('change', loadOrganizations);
    statusFilter.addEventListener('change', loadOrganizations);
    organizationTypeFilter.addEventListener('change', loadOrganizations);

    // Обработчик для поиска с задержкой
    let searchTimeout;
    nameFilter.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadOrganizations, 500);
    });

    // Первоначальная загрузка
    loadOrganizations();

    function createOrgCard(org) {
        const typeIcons = {
            'supplier': 'fas fa-truck',
            'partner': 'fas fa-handshake',
            'government': 'fas fa-landmark',
            'other': 'fas fa-building'
        };
        const roleIcons = {
            'admin': 'fas fa-user-shield',
            'member': 'fas fa-user',
            'guest': 'fas fa-user-tag'
        };
        const statusIcons = {
            'approved': 'fas fa-check-circle',
            'pending': 'fas fa-hourglass-half',
            'rejected': 'fas fa-times-circle'
        };
        const roleNames = {
            'admin': 'Администратор',
            'member': 'Сотрудник',
            'guest': 'Гость'
        };
        const statusNames = {
            'approved': 'Одобрено',
            'pending': 'В ожидании',
            'rejected': 'Отклонено'
        };
        const typeNames = {
            'supplier': 'Поставщик',
            'partner': 'Партнер',
            'government': 'Государственная',
            'other': 'Другое'
        };
        return `
            <div class="farm-card" data-org-id="${org.id}">
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
                <h3 class="farm-name">${org.organization.name}</h3>
                <p class="farm-description">${org.organization.description || 'Нет описания'}</p>
                <div class="farm-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${org.organization.address || 'Нет адреса'}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${formatDate(org.updated_at)}</span>
                </div>
            </div>
        `;
    }

    function formatDate(dateString) {
        // Разбиваем строку на дату и время
        const [datePart, timePart] = dateString.split(' ');
        // Разбиваем дату на день, месяц и год
        const [day, month, year] = datePart.split('.');
        // Создаем объект Date (месяцы в JS начинаются с 0)
        const date = new Date(year, month - 1, day);
        // Форматируем дату в нужный формат
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Toggle badge expansion to reveal labels
    orgsList.addEventListener('click', function(e) {
        const badge = e.target.closest('.farm-badges span');
        if (badge) {
            badge.classList.toggle('expanded');
        }
    });
}); 
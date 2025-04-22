document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const farmsList = document.getElementById('farmsList');
    const addFarmBtn = document.getElementById('addFarmBtn');
    const addFarmModal = document.getElementById('addFarmModal');
    const closeModal = document.querySelector('.close-modal');
    const addFarmForm = document.getElementById('addFarmForm');

    // Загрузка данных ферм
    function loadFarms() {
        farmsList.innerHTML = '<div class="loading-state"></div>';

        fetch('/api/v1/user_farms/', {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                farmsList.innerHTML = `
                    <div class="no-farms">
                        <i class="fas fa-tractor"></i>
                        <h3>У вас пока нет ферм</h3>
                        <p>Создайте новую ферму или попросите владельца добавить вас</p>
                    </div>
                `;
                return;
            }

            farmsList.innerHTML = '';
            data.forEach(farm => {
                farmsList.innerHTML += createFarmCard(farm);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            farmsList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Ошибка загрузки</h3>
                    <p>${error.message}</p>
                </div>
            `;
        });
    }

    // Управление модальным окном
    function showModal() {
        addFarmModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        addFarmModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Обработчики событий
    addFarmBtn.addEventListener('click', showModal);
    closeModal.addEventListener('click', hideModal);

    window.addEventListener('click', function(e) {
        if (e.target === addFarmModal) hideModal();
    });

    // Обработка формы
    addFarmForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('farmName').value,
            description: document.getElementById('farmDescription').value
        };

        fetch('/api/farms/', {
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
            addFarmForm.reset();
            loadFarms();
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

    // Первоначальная загрузка
    loadFarms();

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

    function createFarmCard(farm) {
        return `
            <div class="farm-card" data-farm-id="${farm.id}">
                <div class="farm-header">
                    <h3 class="farm-name">${farm.farm.name}</h3>
                    <span class="farm-role role-${farm.role}">${farm.role}</span>
                </div>
                <p class="farm-description">${farm.farm.description || 'Нет описания'}</p>
                <div class="farm-meta">
                    <span><i class="fas fa-user-shield"></i> ${farm.farm.owner_full_name}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${formatDate(farm.joined_at)}</span>
                </div>
            </div>
        `;
    }
});
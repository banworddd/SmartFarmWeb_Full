document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const codeInputs = document.querySelectorAll('.code-input');
    const form = document.getElementById('confirmation-form');
    const fullCodeInput = document.getElementById('full-code-input');
    const formErrors = document.querySelector('.form-errors');
    const countdownElement = document.getElementById('countdown');
    const newCodeBtn = document.getElementById('new-code-btn');
    const timerContainer = document.querySelector('.timer-container');

    // Константы
    const TOTAL_TIME = 300; // 5 минут в секундах
    const STORAGE_KEY = 'codeTimerData';

    // Инициализация таймера
    let timeLeft = initializeTimer();
    let timerInterval = null;

    // Запуск таймера, если время еще не истекло
    if (timeLeft > 0) {
        timerInterval = setInterval(updateTimer, 1000);
        updateTimerDisplay(); // Обновляем сразу при загрузке
    } else if (timeLeft === 0) {
        handleTimerExpiration(); // Обрабатываем истекшее время
    }

    // Функция инициализации таймера
    function initializeTimer() {
        // Пытаемся получить сохраненное время из sessionStorage
        const savedData = sessionStorage.getItem(STORAGE_KEY);

        if (savedData) {
            const { endTime } = JSON.parse(savedData);
            const remaining = Math.ceil((endTime - Date.now()) / 1000);
            return Math.max(0, remaining);
        }

        // Если нет в storage, используем значение из Django
        if (typeof INITIAL_TIME !== 'undefined' && INITIAL_TIME !== null) {
            const endTime = Date.now() + (INITIAL_TIME * 1000);
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ endTime }));
            return INITIAL_TIME;
        }

        // По умолчанию (на случай ошибки)
        return TOTAL_TIME;
    }

    // Обновление отображения таймера
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Обновление таймера
    function updateTimer() {
        timeLeft--;
        updateTimerDisplay();

        // Сохраняем время в sessionStorage
        const endTime = Date.now() + (timeLeft * 1000);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ endTime }));

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimerExpiration();
            sessionStorage.removeItem(STORAGE_KEY);
        }
    }

    // Действия при истечении времени
    function handleTimerExpiration() {
        // Скрываем таймер
        if (timerContainer) {
            timerContainer.style.display = 'none';
        }

        // Показываем сообщение об ошибке
        if (formErrors) {
            formErrors.innerHTML = `
                <div class="error-message">
                    Срок действия кода истёк, запросите новый
                </div>
            `;
            formErrors.style.display = 'block';

            // Плавная прокрутка к сообщению
            formErrors.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Активируем кнопку запроса нового кода
        if (newCodeBtn) {
            newCodeBtn.style.pointerEvents = "auto";
            newCodeBtn.style.opacity = "1";
            newCodeBtn.style.cursor = "pointer";
        }
    }

    // Блокировка кнопки "Запросить новый код" при наличии времени
    if (timeLeft > 0 && newCodeBtn) {
        newCodeBtn.style.pointerEvents = "none";
        newCodeBtn.style.opacity = "0.5";
        newCodeBtn.style.cursor = "not-allowed";
    }

    // Обработка вставки кода (Ctrl+V)
    codeInputs.forEach(input => {
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text/plain')
                .replace(/\D/g, '')
                .substring(0, 6);

            for (let i = 0; i < pasteData.length; i++) {
                if (codeInputs[i]) codeInputs[i].value = pasteData[i];
            }
            codeInputs[Math.min(pasteData.length, 5)]?.focus();
            clearErrors();
        });
    });

    // Автопереход между полями
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '');
            if (this.value.length === 1 && index < 5) {
                codeInputs[index + 1].focus();
            }
            clearErrors();
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                codeInputs[index - 1].focus();
            }
        });
    });

    // Отправка формы
    form.addEventListener('submit', function(e) {
        const fullCode = Array.from(codeInputs).map(input => input.value).join('');
        fullCodeInput.value = fullCode;

        if (fullCode.length !== 6) {
            e.preventDefault();
            showError('Пожалуйста, заполните все 6 цифр кода');
            codeInputs.forEach(input => {
                if (!input.value) {
                    input.classList.add('error-field');
                    input.addEventListener('input', () => input.classList.remove('error-field'), { once: true });
                }
            });
            formErrors.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    // Очистка полей по двойному клику
    document.addEventListener('dblclick', function(e) {
        if (!e.target.classList.contains('code-input')) {
            codeInputs.forEach(input => {
                input.value = '';
                input.classList.remove('error-field');
            });
            codeInputs[0].focus();
            clearErrors();
        }
    });

    // Вспомогательные функции
    function showError(message) {
        if (formErrors) {
            formErrors.innerHTML = `<div class="error-message">${message}</div>`;
            formErrors.style.display = 'block';
        }
    }

    function clearErrors() {
        if (formErrors) {
            formErrors.innerHTML = '';
            formErrors.style.display = 'none';
        }
    }

    // Очистка при закрытии страницы
    window.addEventListener('beforeunload', () => {
        if (timeLeft <= 0) {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    });
});
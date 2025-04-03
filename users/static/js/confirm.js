document.addEventListener('DOMContentLoaded', function() {
    const codeInputs = document.querySelectorAll('.code-input');
    const form = document.getElementById('confirmation-form');
    const fullCodeInput = document.getElementById('full-code-input');
    const formErrors = document.querySelector('.form-errors');

    // 1. Обработка вставки кода (Ctrl+V)
    codeInputs.forEach(input => {
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text/plain')
                .replace(/\D/g, '') // Оставляем только цифры
                .substring(0, 6);   // Берем первые 6 цифр

            // Заполняем все поля
            for (let i = 0; i < pasteData.length; i++) {
                if (codeInputs[i]) {
                    codeInputs[i].value = pasteData[i];
                }
            }

            // Фокус на последнее заполненное поле
            const lastFilledIndex = Math.min(pasteData.length, 5);
            codeInputs[lastFilledIndex]?.focus();

            clearErrors();
        });
    });

    // 2. Автоматическое переключение между полями
    codeInputs.forEach((input, index) => {
        // При вводе символа
        input.addEventListener('input', function(e) {
            // Оставляем только цифры
            this.value = this.value.replace(/\D/g, '');

            // Переход к следующему полю
            if (this.value.length === 1 && index < 5) {
                codeInputs[index + 1].focus();
            }

            clearErrors();
        });

        // Обработка Backspace
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                codeInputs[index - 1].focus();
            }
        });
    });

    // 3. Обработка отправки формы
    form.addEventListener('submit', function(e) {
        // Собираем полный код из всех полей
        const fullCode = Array.from(codeInputs)
            .map(input => input.value)
            .join('');

        // Записываем в скрытое поле для Django формы
        fullCodeInput.value = fullCode;

        // Валидация
        if (fullCode.length !== 6) {
            e.preventDefault();
            showError('Пожалуйста, заполните все 6 цифр кода');

            // Подсвечиваем пустые поля
            codeInputs.forEach(input => {
                if (!input.value) {
                    input.classList.add('error-field');
                    // Убираем подсветку при следующем вводе
                    input.addEventListener('input', function() {
                        this.classList.remove('error-field');
                    }, { once: true });
                }
            });

            // Прокрутка к ошибке
            formErrors.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    });

    // 4. Удаление всех цифр при двойном клике вне полей
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
        formErrors.innerHTML = `
            <div class="error-message">
                ${message}
            </div>
        `;
        formErrors.style.display = 'block';
    }

    function clearErrors() {
        formErrors.innerHTML = '';
        formErrors.style.display = 'none';
    }
});
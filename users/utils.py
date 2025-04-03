import random

def generate_and_send_confirmation_code(request):
    """
    Генерирует и отправляет код подтверждения пользователю.

    Аргументы:
        request (HttpRequest): Объект запроса, содержащий информацию о сессии пользователя.

    Возвращает:
        str: Сгенерированный код подтверждения.
    """
    confirmation_code = str(random.randint(100000, 999999))
    request.session['confirmation_code'] = confirmation_code

    # Формирование сообщения для пользователя
    message = f"Спасибо за регистрацию, ваш код отправлен на телефон: {confirmation_code}"
    print(message)

    # Запись сообщения в файл messages.txt
    with open('messages.txt', 'a') as file:
        file.write(f"{message} для номера {request.session['phone_number']}\n")

    return confirmation_code

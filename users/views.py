from typing import Any, Dict

from django.shortcuts import redirect
from django.views.generic import CreateView, FormView, RedirectView
from django.contrib.auth import login, logout

from .forms import CustomUserRegistrationForm, CustomUserConfirmationForm, CustomUserLoginForm
from .utils import generate_and_send_confirmation_code
from users.models import CustomUser


class CustomUserRegisterView(CreateView):
    """
    Представление для обработки регистрации пользователя.

    Атрибуты:
        model (CustomUser): Модель, используемая для регистрации пользователя.
        form_class (CustomUserRegistrationForm): Форма, используемая для регистрации пользователя.
        template_name (str): Шаблон, используемый для отображения страницы регистрации.
        success_url (str): URL для перенаправления после успешной регистрации.
    """

    model = CustomUser
    form_class = CustomUserRegistrationForm
    template_name = 'users/reg.html'
    success_url = 'confirm'

    def form_valid(self, form: CustomUserRegistrationForm) -> redirect:
        """
        Обработка валидной формы регистрации.

        Аргументы:
            form (CustomUserRegistrationForm): Экземпляр формы с валидными данными.

        Возвращает:
            redirect: Перенаправление на URL успеха после обработки формы.
        """
        form.save()
        self.request.session['phone_number'] = form.cleaned_data['phone_number']
        print(generate_and_send_confirmation_code(self.request))
        return redirect(self.success_url)


class CustomUserConfirmView(FormView):
    """
    Представление для подтверждения регистрации пользователя.

    Атрибуты:
        model (CustomUser): Модель, используемая для подтверждения пользователя.
        form_class (CustomUserConfirmationForm): Форма, используемая для подтверждения пользователя.
        template_name (str): Шаблон, используемый для отображения страницы подтверждения.
        success_url (str): URL для перенаправления после успешного подтверждения.
    """

    model = CustomUser
    form_class = CustomUserConfirmationForm
    template_name = 'users/confirm.html'
    success_url = '/'

    def get_form_kwargs(self) -> Dict[str, Any]:
        """
        Добавляет объект запроса в аргументы формы.

        Возвращает:
            Dict[str, Any]: Аргументы для формы.
        """
        kwargs = super().get_form_kwargs()
        kwargs['request'] = self.request
        return kwargs

    def form_valid(self, form: CustomUserConfirmationForm) -> redirect:
        """
        Обработка валидной формы подтверждения.

        Аргументы:
            form (CustomUserConfirmationForm): Экземпляр формы с валидными данными.

        Возвращает:
            redirect: Перенаправление на URL успеха после обработки формы.
        """
        phone_number = self.request.session.get('phone_number')
        user = CustomUser.objects.get(phone_number=phone_number)
        user.is_active = True
        user.save()
        login(self.request, user)

        if 'confirmation_code' in self.request.session:
            del self.request.session['confirmation_code']

        return redirect(self.success_url)


class CustomUserLoginView(FormView):
    """
    Представление для обработки входа пользователя.

    Атрибуты:
        model (CustomUser): Модель пользователя, используемая при логине.
        form_class (CustomUserLoginForm): Форма для ввода номера телефона и пароля.
        template_name (str): Шаблон, отображаемый при открытии страницы логина.
        success_url (str): URL для перенаправления после успешного входа.
    """

    model = CustomUser
    form_class = CustomUserLoginForm
    template_name = 'users/login.html'
    success_url = '/'

    def form_valid(self, form: CustomUserLoginForm) -> redirect:
        """
        Обработка валидной формы логина.

        Если пользователь активен, выполняется вход и происходит перенаправление
        на success_url. Если пользователь не активен — происходит перенаправление
        на страницу подтверждения.

        Аргументы:
            form (CustomUserLoginForm): Экземпляр формы с валидными данными.

        Возвращает:
            redirect: Перенаправление в зависимости от статуса пользователя.
        """
        # Получаем пользователя по номеру телефона
        user = CustomUser.objects.get(phone_number=form.cleaned_data.get('phone_number'))

        # Если пользователь не активен — отправляем на страницу подтверждения
        if not user.is_active:
            return redirect('confirm')

        # Вход пользователя в систему
        login(self.request, user)

        # Перенаправление на целевую страницу после логина
        return redirect(self.success_url)


class CustomUserLogoutView(RedirectView):
    url = '/'

    def get(self, request, *args, **kwargs):
        logout(request)
        return super().get(request, *args, **kwargs)



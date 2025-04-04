from typing import Any, Dict

from django.shortcuts import redirect
from django.views.generic import CreateView, FormView
from django.contrib.auth import login

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
    model = CustomUser
    form_class = CustomUserLoginForm
    template_name = 'users/login.html'
    success_url = '/'

    def form_valid(self, form: CustomUserLoginForm) -> redirect:
        user = CustomUser.objects.get(phone_number=form.cleaned_data.get('phone_number'))
        if not user.is_active:
            return redirect('confirm')
        login(self.request, user)
        return redirect(self.success_url)



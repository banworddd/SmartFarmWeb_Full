from django.shortcuts import redirect

class LogoutRequiredMixin:
    """
    Миксин для проверки, что пользователь не аутентифицирован.
    """
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('dashboard')
        return super().dispatch(request, *args, **kwargs)


class LoginRequiredMixin:
    """
    Миксин для проверки, что пользователь аутентифицирован.
    """
    def dispatch(self, request, *args, **kwargs):
        if  not request.user.is_authenticated:
            return redirect('login')
        return super().dispatch(request, *args, **kwargs)


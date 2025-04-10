from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from .views import CustomUserRegisterView, CustomUserConfirmView, CustomUserLoginView, CustomUserLogoutView, \
    CustomUserConfirmNewCodeView

urlpatterns = [
    path('reg', CustomUserRegisterView.as_view(), name='reg'),
    path('confirm', CustomUserConfirmView.as_view(), name='confirm'),
    path('login', CustomUserLoginView.as_view(), name='login'),
    path('logout', CustomUserLogoutView.as_view(), name='logout'),
    path('new_code', CustomUserConfirmNewCodeView.as_view(), name='new_code'),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
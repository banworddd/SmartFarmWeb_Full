from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
urlpatterns = [
    path('v1/', include('DashboardAPI.v1.urls')),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    # Документация в Swagger UI
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Документация в Redoc
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

]
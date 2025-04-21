from django.urls import path, include

urlpatterns = [
    path('v1/', include('DashboardAPI.v1.urls')),
]
from django.urls import path, include


urlpatterns = [
    path('user_pages/', include('DashboardAPI.v1.UserPages.urls')),
    path('ext_org/', include('DashboardAPI.v1.ExtOrgPage.urls')),
    path('profile/', include('DashboardAPI.v1.ProfilePage.urls')),
    path('farm/', include('DashboardAPI.v1.FarmPage.urls'))
]
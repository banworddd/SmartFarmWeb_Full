from django.urls import path

from .views import FarmAPIView, FarmOrganizationAPIView, FarmMembershipsAPIView

urlpatterns = [
    path('main_data/', FarmAPIView.as_view(), name='farm_main_data'),
    path('ext_org/', FarmOrganizationAPIView.as_view(), name='farm_ext_org'),
    path('users/', FarmMembershipsAPIView.as_view(), name='farm_users'),
]
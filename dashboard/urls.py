from django.urls import path
from .views import UserFarmsView, UserExternalOrganizationsView

urlpatterns = [
   path('farms/', UserFarmsView.as_view(), name='dashboard'),
   path('organizations/', UserExternalOrganizationsView.as_view(), name='organizations'),
]

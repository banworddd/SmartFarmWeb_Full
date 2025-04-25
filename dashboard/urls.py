from django.urls import path
from .views import UserFarmsView, UserExternalOrganizationsView, ExternalOrganizationView

urlpatterns = [
   path('farms/', UserFarmsView.as_view(), name='dashboard'),
   path('organizations/<slug:slug>/', ExternalOrganizationView.as_view(), name='organization'),
   path('organizations/', UserExternalOrganizationsView.as_view(), name='organizations'),

]

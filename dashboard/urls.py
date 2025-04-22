from django.urls import path
from .views import UserFarmsView

urlpatterns = [
   path('', UserFarmsView.as_view(), name='dashboard'),
]

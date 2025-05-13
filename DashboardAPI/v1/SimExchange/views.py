from rest_framework import status

from rest_framework.generics import RetrieveUpdateAPIView, UpdateAPIView, RetrieveAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from dashboard.models import DeviceModel, Device
from .serializers import (
    DeviceModelSerializer,
    DeviceSerializer
)


class DevicesModelsAPIView(ListAPIView):
    serializer_class = DeviceModelSerializer

    def get_queryset(self):
        organization_slug = self.request.query_params.get('organization')
        return DeviceModel.objects.filter(
            id__in=Device.objects.filter(
                farm__organization__slug = organization_slug).values_list(
                'model_id',
                flat=True).distinct()).order_by('id')


class DevicesAPIView(ListAPIView):
    serializer_class = DeviceSerializer

    def get_queryset(self):
        organization_slug = self.request.query_params.get('organization')
        return Device.objects.filter(farm__organization__slug = organization_slug).order_by('id')










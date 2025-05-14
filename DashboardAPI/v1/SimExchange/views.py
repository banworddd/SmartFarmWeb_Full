from rest_framework import status

from rest_framework.generics import RetrieveUpdateAPIView, UpdateAPIView, RetrieveAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

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


class SensorDataSend(APIView):
    def post(self, request):
        print('POST received:', request.data)  # <--- лог
        try:
            device_id = request.data['device_id']
            data = request.data['data']
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'device_{device_id}',
                {
                    'type': 'send_sensor_data',
                    'data': data
                }
            )
            return Response({"status": "sent"})
        except Exception as e:
            print("Exception:", e)
            return Response({"error": str(e)}, status=500)











from django.utils import timezone
from rest_framework import status

from rest_framework.generics import RetrieveUpdateAPIView, UpdateAPIView, RetrieveAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from dashboard.models import DeviceModel, Device, SensorData
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

            if data['humidity']:
                humidity = data['humidity']
                SensorData.objects.create(timestamp=timezone.now(), humidity=humidity, device_id=device_id,
                                          battery_level=data['battery_level'] if 'battery_level' in data else None)
            if data['temperature']:
                temperature = data['temperature']
                SensorData.objects.create(timestamp=timezone.now(), temperature=temperature, device_id=device_id,
                                          battery_level=data['battery_level'] if 'battery_level' in data else None)
            if data['soil_moisture']:
                soil_moisture = data['soil_moisture']
                SensorData.objects.create(timestamp=timezone.now(), temperature=soil_moisture, device_id=device_id,
                                          battery_level=data['battery_level'] if 'battery_level' in data else None)
            if data['light_intensity']:
                light_intensity = data['light_intensity']
                SensorData.objects.create(timestamp=timezone.now(), temperature=light_intensity, device_id=device_id,
                                          battery_level=data['battery_level'] if 'battery_level' in data else None)
            if data['ph_level']:
                ph_level = data['ph_level']
                SensorData.objects.create(timestamp=timezone.now(), temperature=ph_level, device_id=device_id,
                                          battery_level=data['battery_level'] if 'battery_level' in data else None)

            return Response({"status": "sent"})
        except Exception as e:
            print("Exception:", e)
            return Response({"error": str(e)}, status=500)











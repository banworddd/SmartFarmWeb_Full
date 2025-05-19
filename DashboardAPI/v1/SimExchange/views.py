from django.utils import timezone
from rest_framework import status

from rest_framework.generics import RetrieveUpdateAPIView, UpdateAPIView, RetrieveAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from dashboard.models import DeviceModel, Device, SensorData, DeviceStatus
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
    def post(self, request):  # <--- лог
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

            if 'humidity' in data:
                humidity = data['humidity']
                SensorData.objects.create(timestamp=data['timestamp'] if 'timestamp' in data else timezone.now(), humidity=humidity, device_id=device_id,
                                          battery_level=data['battery_level'] if 'battery_level' in data else None)
            elif 'temperature' in data:
                temperature = data['temperature']
                SensorData.objects.create(timestamp=data['timestamp'] if 'timestamp' in data else timezone.now(), temperature=temperature, device_id=device_id,
                                          battery_level=data['battery_level'] if 'battery_level' in data else None)
            elif 'soil_moisture' in data:
                soil_moisture = data['soil_moisture']
                SensorData.objects.create(timestamp=data['timestamp'] if 'timestamp' in data else timezone.now(), temperature=soil_moisture, device_id=device_id,
                                          battery_level=data['battery_level'] if 'battery_level' in data else None)
            elif 'light_intensity' in data:
                light_intensity = data['light_intensity']
                SensorData.objects.create(timestamp=data['timestamp'] if 'timestamp' in data else timezone.now(), temperature=light_intensity, device_id=device_id,
                                          battery_level=data['battery_level'] if 'battery_level' in data else None)
            elif 'ph_level' in data:
                ph_level = data['ph_level']
                SensorData.objects.create(timestamp=data['timestamp'] if 'timestamp' in data else timezone.now(), temperature=ph_level, device_id=device_id,
                                          battery_level=data['battery_level'] if 'battery_level' in data else None)

            return Response({"status": "sent"})
        except Exception as e:
            print("Exception:", e)
            return Response({"error": str(e)}, status=500)


class DeviceStatusSend(APIView):
    def post(self, request):
        try:
            device_id = request.data['device_id']
            data = request.data['data']

            if not device_id or not data:
                return Response({"error": "device_id and data are required"}, status=400)

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'device_{device_id}',
                {
                    'type': 'device_status_data',
                    'data': data
                }
            )

            DeviceStatus.objects.create(timestamp = data['timestamp'] if 'timestamp' in data else timezone.now(),
                                        device_id=device_id, online = data['online'] if 'online' in data else False,
                                        cpu_usage=data['cpu_usage'] if 'cpu_usage' in data else None,
                                        memory_usage=data['memory_usage'] if 'memory_usage' in data else None,
                                        disk_usage=data['disk_usage'] if 'disk_usage' in data else None,
                                        signal_strength=data['signal_strength'] if 'signal_strength' in data else None,
                                        additional_info=data['additional_info'] if 'additional_info' in data else None
                                        )
            return Response({"status": "sent"})
        except Exception as e:
            print("Exception:", e)
            return Response({"error": str(e)}, status=500)

class ActuatorDataSend(APIView):
    def post(self, request):
        try:
            device_id = request.data['device_id']
            data = request.data['data']

            if not device_id or not data:
                return Response({"error": "device_id and data are required"}, status=400)

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'device_{device_id}',
                {
                    'type': 'device_actuator_data',
                    'data': data
                }
            )
            return Response({"status": "sent"})

        except Exception as e:
            print("Exception:", e)




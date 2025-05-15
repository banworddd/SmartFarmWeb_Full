import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.serializers.json import DjangoJSONEncoder
from .models import SensorData
from asgiref.sync import sync_to_async

class SensorDataConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.device_id = self.scope['url_route']['kwargs']['device_id']
        self.group_name = f"device_{self.device_id}"

        # Присоединение к группе
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

        latest_data = await self.get_latest_sensor_data(self.device_id)
        # dashboard/consumers.py
        if latest_data:
            await self.send(text_data=json.dumps({
                "type": "send_sensor_data",
                "data": {
                    "humidity": latest_data.humidity,
                    "temperature": latest_data.temperature,
                    "soil_moisture": latest_data.soil_moisture,
                    "light_intensity": latest_data.light_intensity,
                    "ph_level": latest_data.ph_level,
                    "timestamp": latest_data.timestamp.isoformat(),  # Преобразуй datetime в строку
                }
            }))


    async def disconnect(self, close_code):
        # Удаление из группы
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def send_sensor_data(self, event):
        await self.send(text_data=json.dumps({
            "type": "send_sensor_data",
            "data": event['data']
        }))

    async def device_status_data(self, event):
        await self.send(text_data=json.dumps({
            "type": "device_status_data",
            "data" : event['data']
        }))

    @sync_to_async
    def get_latest_sensor_data(self, device_id):
        sensor_data = SensorData.objects.filter(device_id=device_id).order_by("-timestamp").first()
        print(sensor_data)
        return sensor_data

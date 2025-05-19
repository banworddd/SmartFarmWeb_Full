import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.serializers.json import DjangoJSONEncoder
from .models import SensorData, DeviceStatus
from asgiref.sync import sync_to_async
from datetime import datetime

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
        if latest_data:
            data = {}

            if latest_data.humidity is not None:
                data["humidity"] = latest_data.humidity
            if latest_data.temperature is not None:
                data["temperature"] = latest_data.temperature
            if latest_data.soil_moisture is not None:
                data["soil_moisture"] = latest_data.soil_moisture
            if latest_data.light_intensity is not None:
                data["light_intensity"] = latest_data.light_intensity
            if latest_data.ph_level is not None:
                data["ph_level"] = latest_data.ph_level
            if latest_data.battery_level is not None:
                data["battery_level"] = latest_data.battery_level
            if latest_data.timestamp is not None:
                ts_clean = latest_data.timestamp.isoformat().split('+')[0].split('Z')[0]
                dt = datetime.fromisoformat(ts_clean)
                data["timestamp"] = dt.strftime("%d.%m.%Y %H:%M:%S")

            await self.send(text_data=json.dumps({
                "type": "send_sensor_data",
                "data": data
            }))

            latest_status = await self.get_latest_device_status(self.device_id)
            if latest_status:
                data = {}

                if latest_status.online is not None:
                    data["online"] = latest_status.online
                if latest_status.cpu_usage is not None:
                    data["cpu_usage"] = latest_status.cpu_usage
                if latest_status.memory_usage is not None:
                    data["memory_usage"] = latest_status.memory_usage
                if latest_status.disk_usage is not None:
                    data["disk_usage"] = latest_status.disk_usage
                if latest_status.signal_strength is not None:
                    data["signal_strength"] = latest_status.signal_strength
                if latest_status.timestamp is not None:
                    ts_clean = latest_status.timestamp.isoformat().split('+')[0].split('Z')[0]
                    dt = datetime.fromisoformat(ts_clean)
                    data["timestamp"] = dt.strftime("%d.%m.%Y %H:%M:%S")

                await self.send(text_data=json.dumps({
                    "type": "device_status_data",
                    "data": data
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
        timestamp = event['data']['timestamp']

        if timestamp:
            ts_clean = timestamp.split('+')[0].split('Z')[0]
            dt = datetime.fromisoformat(ts_clean)
            formatted_timestamp = dt.strftime("%d.%m.%Y %H:%M:%S")
            event['data']['timestamp'] = formatted_timestamp

        await self.send(text_data=json.dumps({
            "type": "send_sensor_data",
            "data": event['data']
        }))

    async def device_status_data(self, event):
        timestamp = event['data']['timestamp']

        if timestamp:
            ts_clean = timestamp.split('+')[0].split('Z')[0]
            dt = datetime.fromisoformat(ts_clean)
            formatted_timestamp = dt.strftime("%d.%m.%Y %H:%M:%S")
            event['data']['timestamp'] = formatted_timestamp

        await self.send(text_data=json.dumps({
            "type": "device_status_data",
            "data" : event['data']
        }))

    @sync_to_async
    def get_latest_sensor_data(self, device_id):
        sensor_data = SensorData.objects.filter(device_id=device_id).order_by("-timestamp").first()
        return sensor_data

    @sync_to_async
    def get_latest_device_status(self, device_id):
        sensor_data = DeviceStatus.objects.filter(device_id=device_id).order_by("-timestamp").first()
        if sensor_data.device_id == 9:
            print (sensor_data.timestamp)
        return sensor_data

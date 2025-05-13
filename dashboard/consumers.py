from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.serializers import serialize
import json
from dashboard.models import SensorData, Device

class SensorDataConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Получаем ID устройства из URL
        self.device_id = self.scope['url_route']['kwargs'].get('device_id')
        
        # Создаем уникальное имя группы для этого устройства
        self.group_name = f'device_{self.device_id}_sensor_data'

        # Проверяем существование устройства
        if not await self.device_exists():
            await self.close()
            return

        # Подключаемся к группе
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()
        
        # Отправляем последние данные сенсора при подключении
        last_data = await self.get_last_sensor_data()
        if last_data:
            await self.send(text_data=json.dumps(last_data))

    async def disconnect(self, close_code):
        # Отключаемся от группы
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    @database_sync_to_async
    def device_exists(self):
        """Проверка существования устройства"""
        return Device.objects.filter(id=self.device_id).exists()

    @database_sync_to_async
    def get_last_sensor_data(self):
        """Получение последних данных сенсора"""
        try:
            data = SensorData.objects.filter(device_id=self.device_id).order_by('-timestamp').first()
            if data:
                return {
                    'type': 'sensor_data',
                    'data': {
                        'device_id': data.device_id,
                        'timestamp': data.timestamp.isoformat(),
                        'temperature': data.temperature,
                        'humidity': data.humidity,
                        'soil_moisture': data.soil_moisture,
                        'light_intensity': data.light_intensity,
                        'ph_level': data.ph_level,
                        'battery_level': data.battery_level
                    }
                }
        except Exception as e:
            print(f"Error getting sensor data: {str(e)}")
        return None

    async def sensor_data_update(self, event):
        """Обработка обновления данных сенсора"""
        await self.send(text_data=json.dumps(event['data']))

    async def receive(self, text_data):
        """Обработка входящих сообщений"""
        try:
            data = json.loads(text_data)
            if data.get('type') == 'get_last_data':
                last_data = await self.get_last_sensor_data()
                if last_data:
                    await self.send(text_data=json.dumps(last_data))
        except json.JSONDecodeError:
            pass

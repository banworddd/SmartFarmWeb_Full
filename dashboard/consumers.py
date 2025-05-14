# dashboard/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer


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

    async def disconnect(self, close_code):
        # Удаление из группы
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Можно обрабатывать входящие сообщения от клиента (если надо)
        pass

    async def send_sensor_data(self, event):
        # Метод отправки данных в WebSocket-клиент
        await self.send(text_data=json.dumps(event['data']))

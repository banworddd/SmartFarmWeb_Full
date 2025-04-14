from channels.generic.websocket import AsyncWebsocketConsumer
import json

class EchoConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'test_group'

        # Подключаемся к Redis-группе
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()
        await self.send(text_data=json.dumps({
            'message': 'Подключено к WebSocket с Redis'
        }))

    async def disconnect(self, close_code):
        # Отключаемся от Redis-группы
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg = data.get('message', '')

        # Рассылаем сообщение группе через Redis
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat_message',
                'message': msg
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))

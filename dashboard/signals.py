from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import SensorData

@receiver(post_save, sender=SensorData)
def send_sensor_data_update(sender, instance, created, **kwargs):
    """Отправка обновлений через WebSocket при сохранении новых данных сенсора"""
    if created:  # Отправляем только для новых записей
        channel_layer = get_channel_layer()
        group_name = f'device_{instance.device_id}_sensor_data'
        
        # Формируем данные для отправки
        data = {
            'type': 'sensor_data_update',
            'data': {
                'device_id': instance.device_id,
                'timestamp': instance.timestamp.isoformat(),
                'temperature': instance.temperature,
                'humidity': instance.humidity,
                'soil_moisture': instance.soil_moisture,
                'light_intensity': instance.light_intensity,
                'ph_level': instance.ph_level,
                'battery_level': instance.battery_level
            }
        }
        
        # Отправляем данные в группу WebSocket
        async_to_sync(channel_layer.group_send)(
            group_name,
            data
        ) 
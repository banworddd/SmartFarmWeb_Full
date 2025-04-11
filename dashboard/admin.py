from django.contrib import admin
from django.utils import timezone

from .models import (
    Zone,
    DeviceModel,
    Device,
    DeviceLocation,
    SensorData,
    DeviceStatus,
    DeviceEvent,
    DeviceCommand
)


class ZoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'farm', 'zone_type', 'area')
    list_filter = ('farm', 'zone_type')
    filter_horizontal = ('managers',)
    raw_id_fields = ('farm',)

class DeviceModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'manufacturer', 'device_type')
    list_filter = ('device_type', 'manufacturer')
    search_fields = ('name', 'description')

class DeviceAdmin(admin.ModelAdmin):
    list_display = ('name', 'farm', 'model', 'connection_type', 'is_active')
    list_filter = ('farm', 'model', 'connection_type', 'is_active')
    search_fields = ('name', 'serial_number')
    raw_id_fields = ('farm', 'model', 'added_by')
    readonly_fields = ('created_at', 'updated_at')

class DeviceLocationAdmin(admin.ModelAdmin):
    list_display = ('device', 'zone', 'coordinates')
    raw_id_fields = ('device', 'zone')
    readonly_fields = ('last_updated',)

class SensorDataAdmin(admin.ModelAdmin):
    list_display = ('device', 'timestamp', 'temperature', 'humidity')
    list_filter = ('device',)
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'

class DeviceStatusAdmin(admin.ModelAdmin):
    list_display = ('device', 'timestamp', 'online')
    list_filter = ('online',)
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'

class DeviceEventAdmin(admin.ModelAdmin):
    list_display = ('device', 'event_type', 'severity', 'timestamp', 'resolved')
    list_filter = ('event_type', 'severity', 'resolved')
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'
    actions = ['mark_as_resolved']

    def mark_as_resolved(self, request, queryset):
        queryset.update(resolved=True, resolved_at=timezone.now(), resolved_by=request.user)
    mark_as_resolved.short_description = "Mark selected events as resolved"

class DeviceCommandAdmin(admin.ModelAdmin):
    list_display = ('device', 'command', 'status', 'issued_at', 'executed_at')
    list_filter = ('status', 'command')
    readonly_fields = ('issued_at',)
    date_hierarchy = 'issued_at'
    actions = ['retry_failed_commands']

    def retry_failed_commands(self, queryset):
        queryset.filter(status='failed').update(status='pending')
    retry_failed_commands.short_description = "Retry failed commands"

# Регистрация моделей
admin.site.register(Zone, ZoneAdmin)
admin.site.register(DeviceModel, DeviceModelAdmin)
admin.site.register(Device, DeviceAdmin)
admin.site.register(DeviceLocation, DeviceLocationAdmin)
admin.site.register(SensorData, SensorDataAdmin)
admin.site.register(DeviceStatus, DeviceStatusAdmin)
admin.site.register(DeviceEvent, DeviceEventAdmin)
admin.site.register(DeviceCommand, DeviceCommandAdmin)
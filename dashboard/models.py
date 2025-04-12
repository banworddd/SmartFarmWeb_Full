from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.urls import reverse
from datetime import timedelta
from users.models import CustomUser, Farm, FarmGroup, FarmMembership

class Zone(models.Model):
    """
    Модель зоны/участка фермы.

    Эта модель описывает различные зоны на ферме, такие как теплицы, поля, склады и другие
    типы участков. Зоны могут быть использованы для группировки устройств и других объектов
    внутри фермы.

    Атрибуты:
        - name (str): Название зоны.
        - farm (ForeignKey): Ссылка на ферму, к которой принадлежит эта зона.
        - zone_type (str): Тип зоны, например, теплица или поле.
        - description (str): Описание зоны.
        - area (Decimal): Площадь зоны в квадратных метрах.
        - managers (ManyToManyField): Список менеджеров зоны.
        - created_at (datetime): Дата и время создания записи.
        - updated_at (datetime): Дата и время последнего обновления записи.

    Методы:
        - __str__(): Возвращает строковое представление зоны с указанием её названия и типа.
        - get_absolute_url(): Возвращает абсолютный URL для просмотра деталей зоны.
    """

    class ZoneType(models.TextChoices):
        GREENHOUSE = 'greenhouse', _('Теплица')
        FIELD = 'field', _('Поле')
        STORAGE = 'storage', _('Склад')
        LIVESTOCK = 'livestock', _('Животноводческий комплекс')
        OTHER = 'other', _('Другое')

    name = models.CharField(_("Название зоны"), max_length=100)
    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name='zones',
        verbose_name=_("Ферма")
    )
    zone_type = models.CharField(
        _("Тип зоны"),
        max_length=20,
        choices=ZoneType.choices,
        default=ZoneType.FIELD
    )
    description = models.TextField(_("Описание"), blank=True)
    area = models.DecimalField(
        _("Площадь (кв.м)"),
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )
    managers = models.ManyToManyField(
        CustomUser,
        related_name='managed_zones',
        blank=True,
        verbose_name=_("Менеджеры зоны")
    )
    created_at = models.DateTimeField(_("Дата создания"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Дата обновления"), auto_now=True)

    class Meta:
        verbose_name = _("Зона")
        verbose_name_plural = _("Зоны")
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'farm'],
                name='unique_zone_name_per_farm'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.get_zone_type_display()})"

    def get_absolute_url(self):
        return reverse('zone-detail', kwargs={'pk': self.pk})



class DeviceModel(models.Model):
    """
    Модель/шаблон устройства.

    Эта модель описывает шаблон для устройств, таких как датчики, контроллеры и другие
    устройства. В ней содержится информация о производителе, характеристиках устройства
    и других данных, которые могут быть общими для множества устройств одного типа.

    Атрибуты:
        - name (str): Название модели устройства.
        - manufacturer (str): Производитель устройства.
        - device_type (str): Тип устройства (например, датчик, контроллер).
        - description (str): Описание модели устройства.
        - specifications (JSONField): Характеристики устройства в формате JSON.
        - created_by (ForeignKey): Пользователь, который создал модель устройства.
        - created_at (datetime): Дата и время создания записи.
        - updated_at (datetime): Дата и время последнего обновления записи.

    Методы:
        - __str__(): Возвращает строковое представление модели устройства, включая производителя и название.
    """

    name = models.CharField(_("Название модели"), max_length=100)
    manufacturer = models.CharField(_("Производитель"), max_length=100)
    device_type = models.CharField(
        _("Тип устройства"),
        max_length=50,
        choices=[
            ('sensor', _('Датчик')),
            ('actuator', _('Активатор')),
            ('controller', _('Контроллер')),
            ('gateway', _('Шлюз')),
            ('camera', _('Камера')),
            ('robot', _('Робот'))
        ]
    )
    description = models.TextField(_("Описание"), blank=True)
    specifications = models.JSONField(_("Характеристики"), default=dict, blank=True)
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Создано пользователем")
    )
    created_at = models.DateTimeField(_("Дата создания"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Дата обновления"), auto_now=True)

    class Meta:
        verbose_name = _("Модель устройства")
        verbose_name_plural = _("Модели устройств")
        ordering = ['manufacturer', 'name']

    def __str__(self):
        return f"{self.manufacturer} {self.name}"


class Device(models.Model):
    """
    Модель физического устройства.

    Эта модель описывает физическое устройство на ферме, такое как датчик, актуатор или контроллер.
    Она содержит информацию о типе устройства, его состоянии, характеристиках подключения и
    других параметрах.

    Атрибуты:
        - name (str): Название устройства.
        - farm (ForeignKey): Ферма, к которой принадлежит устройство.
        - added_by (ForeignKey): Пользователь, который добавил устройство.
        - model (ForeignKey): Модель устройства, к которой относится это устройство.
        - serial_number (str): Уникальный серийный номер устройства.
        - connection_type (str): Тип подключения устройства (например, Wi-Fi, Ethernet).
        - mac_address (str): MAC-адрес устройства (если применимо).
        - ip_address (str): IP-адрес устройства (если применимо).
        - firmware_version (str): Версия прошивки устройства.
        - is_active (bool): Статус активности устройства.
        - installation_date (date): Дата установки устройства.
        - last_maintenance (date): Дата последнего обслуживания устройства.
        - maintenance_interval (int): Интервал обслуживания в днях.
        - created_at (datetime): Дата и время создания записи.
        - updated_at (datetime): Дата и время последнего обновления записи.

    Методы:
        - __str__(): Возвращает строковое представление устройства с его названием и моделью.
        - needs_maintenance (property): Проверяет, требуется ли устройству обслуживание в зависимости от интервала обслуживания и даты последнего обслуживания.
    """

    class ConnectionType(models.TextChoices):
        WIFI = 'wifi', _('Wi-Fi')
        ETHERNET = 'ethernet', _('Ethernet')
        LORA = 'lora', _('LoRa')
        ZIGBEE = 'zigbee', _('Zigbee')
        CELLULAR = 'cellular', _('Сотовая связь')
        BLUETOOTH = 'bluetooth', _('Bluetooth')
        RS485 = 'rs485', _('RS-485')

    name = models.CharField(_("Название устройства"), max_length=100)
    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name='devices',
        verbose_name=_("Ферма")
    )
    added_by = models.ForeignKey(
        CustomUser,
        null = True,
        on_delete=models.SET_NULL,
        related_name='added_devices',
        verbose_name=_("Добавлено пользователем")
    )
    model = models.ForeignKey(
        DeviceModel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Модель устройства")
    )
    serial_number = models.CharField(
        _("Серийный номер"),
        max_length=50,
        unique=True
    )
    connection_type = models.CharField(
        _("Тип подключения"),
        max_length=20,
        choices=ConnectionType.choices,
        default=ConnectionType.WIFI
    )
    mac_address = models.CharField(
        _("MAC-адрес"),
        max_length=17,
        blank=True,
        null=True,
        unique=True
    )
    ip_address = models.GenericIPAddressField(
        _("IP-адрес"),
        blank=True,
        null=True,
        unique=True
    )
    firmware_version = models.CharField(
        _("Версия прошивки"),
        max_length=20,
        blank=True
    )
    is_active = models.BooleanField(_("Активно"), default=True)
    installation_date = models.DateField(
        _("Дата установки"),
        blank=True,
        null=True
    )
    last_maintenance = models.DateField(
        _("Последнее обслуживание"),
        blank=True,
        null=True
    )
    maintenance_interval = models.PositiveIntegerField(
        _("Интервал обслуживания (дни)"),
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(
        _("Дата создания"),
        auto_now_add=True)
    updated_at = models.DateTimeField(
        _("Дата обновления"),
        auto_now=True)

    gateway_device = models.ForeignKey(
        'self', on_delete=models.SET_NULL,
        null=True,
        related_name='gateway_devices',
    )


    class Meta:
        verbose_name = _("Устройство")
        verbose_name_plural = _("Устройства")
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['farm']),
        ]

    def __str__(self):
        return f"{self.name} ({self.model.name if self.model else 'No model'})"

    @property
    def needs_maintenance(self):
        if self.last_maintenance and self.maintenance_interval:
            due_date = self.last_maintenance + timedelta(days=self.maintenance_interval)
            return timezone.now().date() >= due_date
        return False


class DeviceLocation(models.Model):
    """
    Модель местоположения устройства на ферме.

    Эта модель позволяет хранить данные о местоположении устройства на ферме, включая
    координаты и зону, к которой оно относится.

    Атрибуты:
        - device (ForeignKey): Устройство, которому принадлежит это местоположение.
        - zone (ForeignKey): Зона фермы, в которой установлено устройство.
        - latitude (Decimal): Широта местоположения устройства.
        - longitude (Decimal): Долгота местоположения устройства.
        - installation_notes (str): Примечания по установке устройства.
        - last_updated (datetime): Дата и время последнего обновления местоположения устройства.

    Методы:
        - clean(): Проверяет, что зона устройства принадлежит той же ферме, что и само устройство.
        - __str__(): Возвращает строковое представление местоположения устройства.
        - coordinates (property): Возвращает строковое представление координат устройства.
    """

    device = models.OneToOneField(
        Device,
        on_delete=models.CASCADE,
        related_name='location',
        verbose_name=_("Устройство")
    )
    zone = models.ForeignKey(
        Zone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Зона"),
        limit_choices_to={'owner': models.F('device__owner')}
    )
    latitude = models.DecimalField(
        _("Широта"),
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )
    longitude = models.DecimalField(
        _("Долгота"),
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )
    installation_notes = models.TextField(
        _("Примечания по установке"),
        blank=True
    )
    last_updated = models.DateTimeField(
        _("Последнее обновление"),
        auto_now=True
    )

    class Meta:
        verbose_name = _("Местоположение устройства")
        verbose_name_plural = _("Местоположения устройств")

    def clean(self):
        if self.zone and self.zone.farm != self.device.farm:
            raise ValidationError(
                _("Зона должна принадлежать той же ферме, что и устройство")
            )

    def __str__(self):
        return f"Location of {self.device.name}"

    @property
    def coordinates(self):
        if self.latitude and self.longitude:
            return f"{self.latitude}, {self.longitude}"
        return _("Не указано")


class SensorData(models.Model):
    """
    Модель местоположения устройства на ферме.

    Эта модель позволяет хранить данные о местоположении устройства на ферме, включая
    координаты и зону, к которой оно относится.

    Атрибуты:
        - device (ForeignKey): Устройство, которому принадлежит это местоположение.
        - zone (ForeignKey): Зона фермы, в которой установлено устройство.
        - latitude (Decimal): Широта местоположения устройства.
        - longitude (Decimal): Долгота местоположения устройства.
        - installation_notes (str): Примечания по установке устройства.
        - last_updated (datetime): Дата и время последнего обновления местоположения устройства.

    Методы:
        - clean(): Проверяет, что зона устройства принадлежит той же ферме, что и само устройство.
        - __str__(): Возвращает строковое представление местоположения устройства.
        - coordinates (property): Возвращает строковое представление координат устройства.
    """

    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='sensor_data',
        verbose_name=_("Устройство"),
        limit_choices_to={'model__device_type': 'sensor'}
    )
    timestamp = models.DateTimeField(_("Временная метка"), auto_now_add=True)
    temperature = models.FloatField(
        _("Температура (°C)"),
        blank=True,
        null=True
    )
    humidity = models.FloatField(
        _("Влажность (%)"),
        blank=True,
        null=True
    )
    soil_moisture = models.FloatField(
        _("Влажность почвы (%)"),
        blank=True,
        null=True
    )
    light_intensity = models.FloatField(
        _("Интенсивность света (люкс)"),
        blank=True,
        null=True
    )
    ph_level = models.FloatField(
        _("Уровень pH"),
        blank=True,
        null=True
    )
    battery_level = models.FloatField(
        _("Уровень заряда батареи (%)"),
        blank=True,
        null=True
    )
    additional_data = models.JSONField(
        _("Дополнительные данные"),
        default=dict,
        blank=True
    )

    class Meta:
        verbose_name = _("Данные датчика")
        verbose_name_plural = _("Данные датчиков")
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['device']),
        ]

    def __str__(self):
        return f"Data from {self.device.name} at {self.timestamp}"


class DeviceStatus(models.Model):
    """
    Модель местоположения устройства на ферме.

    Эта модель позволяет хранить данные о местоположении устройства на ферме, включая
    координаты и зону, к которой оно относится.

    Атрибуты:
        - device (ForeignKey): Устройство, которому принадлежит это местоположение.
        - zone (ForeignKey): Зона фермы, в которой установлено устройство.
        - latitude (Decimal): Широта местоположения устройства.
        - longitude (Decimal): Долгота местоположения устройства.
        - installation_notes (str): Примечания по установке устройства.
        - last_updated (datetime): Дата и время последнего обновления местоположения устройства.

    Методы:
        - clean(): Проверяет, что зона устройства принадлежит той же ферме, что и само устройство.
        - __str__(): Возвращает строковое представление местоположения устройства.
        - coordinates (property): Возвращает строковое представление координат устройства.
    """

    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='statuses',
        verbose_name=_("Устройство")
    )
    timestamp = models.DateTimeField(_("Временная метка"), auto_now_add=True)
    online = models.BooleanField(_("Онлайн"))
    cpu_usage = models.FloatField(
        _("Использование CPU (%)"),
        blank=True,
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    memory_usage = models.FloatField(
        _("Использование памяти (%)"),
        blank=True,
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    disk_usage = models.FloatField(
        _("Использование диска (%)"),
        blank=True,
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    signal_strength = models.FloatField(
        _("Сила сигнала (dBm)"),
        blank=True,
        null=True
    )
    additional_info = models.JSONField(
        _("Дополнительная информация"),
        blank=True,
        null=True
    )

    class Meta:
        verbose_name = _("Статус устройства")
        verbose_name_plural = _("Статусы устройств")
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['device', 'online']),
        ]

    def __str__(self):
        status = _("онлайн") if self.online else _("оффлайн")
        return f"{self.device.name} is {status} at {self.timestamp}"


class DeviceEvent(models.Model):
    """Модель событий устройства"""
    class EventType(models.TextChoices):
        ERROR = 'error', _('Ошибка')
        WARNING = 'warning', _('Предупреждение')
        INFO = 'info', _('Информация')
        MAINTENANCE = 'maintenance', _('Обслуживание')
        ALERT = 'alert', _('Тревога')

    class EventSeverity(models.TextChoices):
        CRITICAL = 'critical', _('Критический')
        HIGH = 'high', _('Высокий')
        MEDIUM = 'medium', _('Средний')
        LOW = 'low', _('Низкий')

    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='events',
        verbose_name=_("Устройство")
    )
    event_type = models.CharField(
        _("Тип события"),
        max_length=20,
        choices=EventType.choices
    )
    severity = models.CharField(
        _("Уровень важности"),
        max_length=20,
        choices=EventSeverity.choices,
        default=EventSeverity.MEDIUM
    )
    timestamp = models.DateTimeField(_("Временная метка"), auto_now_add=True)
    message = models.TextField(_("Сообщение"))
    data = models.JSONField(_("Данные события"), blank=True, null=True)
    resolved = models.BooleanField(_("Решено"), default=False)
    resolved_at = models.DateTimeField(_("Время решения"), blank=True, null=True)
    resolved_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        verbose_name=_("Кем решено")
    )

    class Meta:
        verbose_name = _("Событие устройства")
        verbose_name_plural = _("События устройств")
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['device', 'event_type']),
            models.Index(fields=['resolved']),
        ]

    def __str__(self):
        return f"[{self.get_event_type_display()}] {self.message}"

    def resolve(self, user=None):
        self.resolved = True
        self.resolved_at = timezone.now()
        if user:
            self.resolved_by = user
        self.save()


class DeviceCommand(models.Model):
    """Модель команд для устройств"""
    class CommandStatus(models.TextChoices):
        PENDING = 'pending', _('Ожидает')
        SENT = 'sent', _('Отправлено')
        EXECUTED = 'executed', _('Выполнено')
        FAILED = 'failed', _('Ошибка')
        TIMEOUT = 'timeout', _('Таймаут')

    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='commands',
        verbose_name=_("Устройство")
    )
    command = models.CharField(_("Команда"), max_length=100)
    parameters = models.JSONField(_("Параметры"), blank=True, null=True)
    issued_at = models.DateTimeField(_("Время отправки"), auto_now_add=True)
    executed_at = models.DateTimeField(_("Время выполнения"), blank=True, null=True)
    status = models.CharField(
        _("Статус"),
        max_length=20,
        choices=CommandStatus.choices,
        default=CommandStatus.PENDING
    )
    issued_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        verbose_name=_("Кем отправлено")
    )
    response = models.JSONField(_("Ответ устройства"), blank=True, null=True)
    timeout = models.PositiveIntegerField(_("Таймаут (сек)"), default=30)

    class Meta:
        verbose_name = _("Команда устройства")
        verbose_name_plural = _("Команды устройств")
        ordering = ['-issued_at']
        indexes = [
            models.Index(fields=['-issued_at']),
            models.Index(fields=['device', 'status']),
        ]

    def __str__(self):
        return f"Command '{self.command}' to {self.device.name}"

    def mark_as_executed(self, response=None):
        self.status = self.CommandStatus.EXECUTED
        self.executed_at = timezone.now()
        if response:
            self.response = response
        self.save()

    def mark_as_failed(self, error=None):
        self.status = self.CommandStatus.FAILED
        self.executed_at = timezone.now()
        if error:
            self.response = {'error': str(error)}
        self.save()
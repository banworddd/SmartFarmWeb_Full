from django.db import models


class Area(models.Model):
    """
    Модель, представляющая участок (зону) умной фермы.

    Используется для логического разделения территории фермы на отдельные зоны,
    в которых могут располагаться различные устройства (датчики, исполнительные механизмы и т.д.).

    Атрибуты:
        name (str): Название участка.
        description (str, optional): Описание участка или дополнительные сведения о нём.

    Метод __str__ возвращает название участка.
    """

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Device(models.Model):
    """
    Абстрактная модель устройства умной фермы.

    Является базовой моделью для всех типов устройств (датчиков, контроллеров, исполнительных механизмов и др.).
    Содержит общие поля, характерные для любого устройства.

    Атрибуты:
        name (str): Название устройства.
        description (str, optional): Описание устройства или его характеристики.
        area (Area, optional): Участок (зона), к которому привязано устройство.
        is_active (bool): Флаг активности устройства (например, включено или отключено).

    Метод __str__ возвращает название устройства.

    Примечание:
        Класс является абстрактным и не создаёт отдельной таблицы в базе данных.
        Для конкретных устройств необходимо создавать модели-наследники.
    """

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    area = models.ForeignKey('Area', on_delete=models.SET_NULL, null=True, blank=True, related_name='devices')
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True

    def __str__(self):
        return self.name


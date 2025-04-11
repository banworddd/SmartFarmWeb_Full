from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils.translation import gettext_lazy as _
from typing import Dict, List

from .managers import CustomUserManager


class CustomUser(AbstractUser):
    """
    Расширенная модель пользователя для использования в приложении.
    Модель добавляет поле для телефона, email, и переопределяет логику работы с username.

    Атрибуты:
        phone_number (CharField): Уникальный номер телефона пользователя.
        email (EmailField): Уникальный email пользователя (может быть пустым).
        first_name (CharField): Имя пользователя.
        last_name (CharField): Фамилия пользователя.
        username (CharField): Имя пользователя (не обязательно).
        is_active (BooleanField): Флаг активности пользователя.
        farms (ManyToManyField): Связь с фермерскими хозяйствами пользователя.
        groups (ManyToManyField): Группы, к которым принадлежит пользователь.
        user_permissions (ManyToManyField): Права доступа пользователя.
    """

    # Поле для хранения уникального номера телефона пользователя
    phone_number = models.CharField(
        max_length=10,
        unique=True,
        help_text="Номер телефона пользователя",
    )

    # Поле для хранения уникального email пользователя
    email = models.EmailField(
        unique=True,
        help_text="Email пользователя"
    )

    # Имя пользователя
    first_name = models.CharField(
        max_length=30,
        help_text="Имя пользователя"
    )

    # Фамилия пользователя
    last_name = models.CharField(
        max_length=30,
        help_text="Фамилия пользователя"
    )

    # Имя пользователя в системе
    username = models.CharField(
        max_length=10,
        blank=True,  # Имя пользователя не обязательно
        help_text="Имя пользователя в системе"
    )

    # Статус активности пользователя
    is_active = models.BooleanField(
        default=False,
        help_text="Флаг активности пользователя"
    )

    # Связь с моделями фермерских хозяйств через промежуточную модель FarmMembership
    farms = models.ManyToManyField(
        'Farm',
        through='FarmMembership',
        related_name='members',
        verbose_name=_('Фермы')
    )

    # Для аутентификации используется поле phone_number, а не username
    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'username', 'email']

    # Группы, к которым принадлежит пользователь
    groups = models.ManyToManyField(
        "auth.Group",
        related_name="customuser_set",
        blank=True,
        help_text="Группы, к которым принадлежит пользователь"
    )

    # Права доступа пользователя
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="customuser_permissions",
        blank=True,
        help_text="Права доступа пользователя"
    )

    # Использование кастомного менеджера для создания суперпользователей
    objects = CustomUserManager()

    def save(self, *args, **kwargs):
        """
        Переопределяет метод save для того, чтобы при сохранении автоматически
        присваивался номер телефона как username.

        Это гарантирует, что поле username будет заполнено значением phone_number,
        если оно не было указано при создании пользователя.
        """
        self.username = self.phone_number
        super().save(*args, **kwargs)

    def __str__(self):
        """
        Возвращает строковое представление пользователя.

        Возвращает:
            str: Имя пользователя, если оно указано, или телефонный номер, если имя отсутствует.
        """
        return self.first_name or self.phone_number


class Farm(models.Model):
    """
    Модель фермы/хозяйства.

    Атрибуты:
        name (CharField): Название фермы (уникальное).
        owner (ForeignKey): Владелец фермы, который является пользователем.
        created_at (DateTimeField): Дата и время создания фермы.
        updated_at (DateTimeField): Дата и время последнего обновления фермы.
        description (TextField): Описание фермы.
    """

    # Название фермы (уникальное)
    name = models.CharField(
        _('Название'),
        max_length=100,
        unique=True
    )

    # Владелец фермы (пользователь, связанный с фермером)
    owner = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='owned_farms',
        verbose_name=_('Владелец')
    )

    # Дата создания фермы
    created_at = models.DateTimeField(
        _('Дата создания'),
        auto_now_add=True
    )

    # Дата последнего обновления фермы
    updated_at = models.DateTimeField(
        _('Дата обновления'),
        auto_now=True
    )

    # Описание фермы (необязательно)
    description = models.TextField(
        _('Описание'),
        blank=True
    )

    class Meta:
        verbose_name = _('Ферма')
        verbose_name_plural = _('Фермы')
        permissions = [
            ('manage_farm', _('Может управлять фермой')),
            ('add_device', _('Может добавлять устройства')),
            ('delete_device', _('Может удалять устройства')),
            ('view_device', _('Может просматривать устройства')),
            ('control_device', _('Может управлять устройствами')),
        ]

    def __str__(self):
        """
        Возвращает строковое представление фермы (её название).

        Возвращает:
            str: Название фермы.
        """
        return self.name


class FarmMembership(models.Model):
    """
    Модель членства пользователя в ферме с ролями.

    Атрибуты:
        user (ForeignKey): Пользователь, который является членом фермы.
        farm (ForeignKey): Ферма, к которой принадлежит пользователь.
        role (CharField): Роль пользователя в ферме.
        joined_at (DateTimeField): Дата и время присоединения пользователя к ферме.
        updated_at (DateTimeField): Дата и время последнего обновления членства.
    """

    class Role(models.TextChoices):
        """Роли пользователя в ферме"""
        OWNER = 'owner', _('Владелец')
        ADMIN = 'admin', _('Администратор')
        MANAGER = 'manager', _('Менеджер')
        TECHNICIAN = 'technician', _('Техник')
        VIEWER = 'viewer', _('Наблюдатель')

    # Пользователь, который является членом фермы
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        verbose_name=_('Пользователь')
    )

    # Ферма, к которой принадлежит пользователь
    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        verbose_name=_('Ферма')
    )

    # Роль пользователя в ферме
    role = models.CharField(
        _('Роль'),
        max_length=20,
        choices=Role.choices,
        default=Role.VIEWER
    )

    # Дата и время присоединения пользователя
    joined_at = models.DateTimeField(
        _('Дата присоединения'),
        auto_now_add=True
    )

    # Дата и время последнего обновления членства
    updated_at = models.DateTimeField(
        _('Дата обновления'),
        auto_now=True
    )

    class Meta:
        verbose_name = _('Членство в ферме')
        verbose_name_plural = _('Членства в фермах')
        unique_together = ('user', 'farm')

    def __str__(self):
        """
        Возвращает строковое представление членства пользователя в ферме.

        Возвращает:
            str: Строка, представляющая пользователя, ферму и роль.
        """
        return f"{self.user} в {self.farm} как {self.get_role_display()}"

    @property
    def permissions(self) -> List[str]:
        """
        Возвращает список разрешений для роли с правильной типизацией.

        Возвращает:
            List[str]: Список разрешений для роли пользователя в ферме.
        """
        role_permissions: Dict[str, List[str]] = {
            self.Role.OWNER: [
                'manage_farm',
                'add_device',
                'delete_device',
                'view_device',
                'control_device',
            ],
            self.Role.ADMIN: [
                'add_device',
                'delete_device',
                'view_device',
                'control_device',
            ],
            self.Role.MANAGER: [
                'view_device',
                'control_device',
            ],
            self.Role.TECHNICIAN: [
                'view_device',
            ],
            self.Role.VIEWER: [
                'view_device',
            ],
        }
        return role_permissions.get(str(self.role), [])


class FarmGroup(Group):
    """
    Расширенная модель группы для фермы.

    Атрибуты:
        farm (ForeignKey): Ферма, с которой связана группа.
        description (TextField): Описание группы.
        created_at (DateTimeField): Дата и время создания группы.
    """

    # Ферма, с которой связана группа
    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name='groups',
        verbose_name=_('Ферма')
    )

    # Описание группы (необязательно)
    description = models.TextField(
        _('Описание'),
        blank=True
    )

    # Дата и время создания группы
    created_at = models.DateTimeField(
        _('Дата создания'),
        auto_now_add=True
    )

    class Meta:
        verbose_name = _('Группа фермы')
        verbose_name_plural = _('Группы ферм')

    def __str__(self):
        """
        Возвращает строковое представление группы фермы (её название и ферму).

        Возвращает:
            str: Название группы и ферма, к которой она принадлежит.
        """
        return f"{self.name} ({self.farm})"

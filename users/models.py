from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils.translation import gettext_lazy as _
from typing import Dict, List

class CustomUser(AbstractUser):
    """
    Расширенная модель пользователя с дополнительными полями.

    Атрибуты:
        phone_number (CharField): Номер телефона пользователя, уникальный.
        email (EmailField): Email пользователя, уникальный, может быть пустым.
        first_name (CharField): Имя пользователя.
        last_name (CharField): Фамилия пользователя.
        username (CharField): Имя пользователя, может быть пустым.
        is_active (BooleanField): Флаг активности пользователя.
        groups (ManyToManyField): Группы, к которым принадлежит пользователь.
        user_permissions (ManyToManyField): Права доступа пользователя.
    """

    phone_number = models.CharField(
        max_length=10,
        unique=True,
        help_text="Номер телефона пользователя",
        null=True,

    )
    email = models.EmailField(
        unique=True,
        null=True,
        blank=True,
        help_text="Email пользователя"
    )
    first_name = models.CharField(
        max_length=30,
        help_text="Имя пользователя"
    )
    last_name = models.CharField(
        max_length=30,
        help_text="Фамилия пользователя"
    )
    username = models.CharField(
        null=True,
        blank=True,
        help_text="Имя пользователя, может быть пустым"
    )
    is_active = models.BooleanField(
        default=False,
        help_text="Флаг активности пользователя"
    )
    farms = models.ManyToManyField(
        'Farm',
        through='FarmMembership',
        related_name='members',
        verbose_name=_('Фермы')
    )

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    groups = models.ManyToManyField(
        "auth.Group",
        related_name="customuser_set",
        blank=True,
        help_text="Группы, к которым принадлежит пользователь"
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="customuser_permissions",
        blank=True,
        help_text="Права доступа пользователя"
    )

    def __str__(self):
        """
        Возвращает строковое представление пользователя.

        Возвращает:
            str: Имя пользователя.
        """
        return self.username

class Farm(models.Model):
    """Модель фермы/хозяйства"""
    name = models.CharField(
        _('Название'),
        max_length=100,
        unique=True
    )
    owner = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='owned_farms',
        verbose_name=_('Владелец')
    )
    created_at = models.DateTimeField(
        _('Дата создания'),
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        _('Дата обновления'),
        auto_now=True
    )
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
        return self.name


class FarmMembership(models.Model):
    """Модель членства пользователя в ферме с ролями"""
    class Role(models.TextChoices):
        OWNER = 'owner', _('Владелец')
        ADMIN = 'admin', _('Администратор')
        MANAGER = 'manager', _('Менеджер')
        TECHNICIAN = 'technician', _('Техник')
        VIEWER = 'viewer', _('Наблюдатель')

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        verbose_name=_('Пользователь')
    )
    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        verbose_name=_('Ферма')
    )
    role = models.CharField(
        _('Роль'),
        max_length=20,
        choices=Role.choices,
        default=Role.VIEWER
    )
    joined_at = models.DateTimeField(
        _('Дата присоединения'),
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        _('Дата обновления'),
        auto_now=True
    )

    class Meta:
        verbose_name = _('Членство в ферме')
        verbose_name_plural = _('Членства в фермах')
        unique_together = ('user', 'farm')

    def __str__(self):
        return f"{self.user} в {self.farm} как {self.get_role_display()}"

    @property
    def permissions(self) -> List[str]:
        """Возвращает список разрешений для роли с правильной типизацией"""
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
    """Расширенная модель группы для фермы"""
    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name='groups',
        verbose_name=_('Ферма')
    )
    description = models.TextField(
        _('Описание'),
        blank=True
    )
    created_at = models.DateTimeField(
        _('Дата создания'),
        auto_now_add=True
    )

    class Meta:
        verbose_name = _('Группа фермы')
        verbose_name_plural = _('Группы ферм')

    def __str__(self):
        return f"{self.name} ({self.farm})"
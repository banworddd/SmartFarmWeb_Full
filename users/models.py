from typing import Dict, List
from slugify import slugify

from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils.translation import gettext_lazy as _

from .managers import CustomUserManager


class CustomUser(AbstractUser):
    """
    Расширенная модель пользователя для использования в приложении.

    Атрибуты:
        phone_number (CharField): Уникальный номер телефона пользователя.
        email (EmailField): Уникальный email пользователя.
        first_name (CharField): Имя пользователя.
        last_name (CharField): Фамилия пользователя.
        username (CharField): Имя пользователя.
        is_active (BooleanField): Флаг активности пользователя.
        farms (ManyToManyField): Фермы через FarmMembership.
        organizations (ManyToManyField): Внешние организации.
    """

    phone_number = models.CharField(
        max_length=10,
        unique=True,
        help_text=_("Номер телефона пользователя"),
    )

    email = models.EmailField(
        unique=True,
        help_text=_("Email пользователя")
    )

    first_name = models.CharField(
        max_length=30,
        help_text=_("Имя пользователя")
    )

    last_name = models.CharField(
        max_length=30,
        help_text=_("Фамилия пользователя")
    )

    username = models.CharField(
        max_length=10,
        blank=True,
        help_text=_("Имя пользователя в системе")
    )

    profile_pic = models.ImageField(
        default='profile_pics/default.png',
        upload_to='profile_pics/',
        blank=True,
        null = True,
    )

    is_active = models.BooleanField(
        default=False,
        help_text=_("Флаг активности пользователя")
    )

    is_deleted = models.BooleanField(
        default=False,
        help_text=_("Флаг мягкого удаления пользователя")
    )

    farms = models.ManyToManyField(
        'Farm',
        through='FarmMembership',
        related_name='members',
        verbose_name=_('Фермы')
    )

    organizations = models.ManyToManyField(
        'ExternalOrganization',
        through='ExternalOrganizationMembership',
        related_name='members',
        verbose_name=_('Организации'),
        blank=True,
        help_text=_('Организации, в которых состоит пользователь')
    )

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'username', 'email']

    objects = CustomUserManager()

    def save(self, *args, **kwargs):
        if not self.profile_pic:
            self.profile_pic = 'profile_pics/default.png'

        self.username = self.phone_number
        super().save(*args, **kwargs)

    def __str__(self):
        return self.first_name or self.phone_number


class ExternalOrganization(models.Model):
    """
    Модель внешней организации, сотрудничающей с фермерскими хозяйствами.

    Атрибуты:
        name (CharField): Название организации (уникальное)
        type (CharField): Тип организации
        description (TextField): Описание организации
        admins (ManyToManyField): Администраторы организации
        created_at (DateTimeField): Дата создания
        updated_at (DateTimeField): Дата последнего обновления
        farms (ManyToManyField): Фермы, связанные с организацией
    """

    class OrganizationType(models.TextChoices):
        """Типы организаций"""
        SUPPLIER = 'supplier', _('Поставщик')
        PARTNER = 'partner', _('Партнер')
        GOVERNMENT = 'government', _('Госорганизация')
        OTHER = 'other', _('Другое')

    name = models.CharField(
        _('Название организации'),
        max_length=100,
        unique=True,
        help_text=_('Полное официальное название организации')
    )

    type = models.CharField(
        _('Тип организации'),
        max_length=20,
        choices=OrganizationType.choices,
        default=OrganizationType.OTHER
    )

    slug = models.SlugField(
        _('Slug организации'),
        blank=True
    )

    address = models.CharField(
        _('Адрес организации'),
        max_length=250,
        blank = True
    )

    email = models.EmailField(
        _('E-mail организации'),
        blank=True,
        null=True,
    )

    phone = models.CharField(
        _('Телефон организации'),
        max_length=20,
        blank=True,
        null=True)

    website = models.URLField(
        _('Веб-сайт организации'),
                blank=True,
        null=True)

    description = models.TextField(
        _('Описание'),
        blank=True,
        help_text=_('Подробное описание деятельности организации')
    )

    created_at = models.DateTimeField(
        _('Дата создания'),
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        _('Дата обновления'),
        auto_now=True
    )

    class Meta:
        verbose_name = _('Внешняя организация')
        verbose_name_plural = _('Внешние организации')
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super(ExternalOrganization, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class ExternalOrganizationMembership(models.Model):
    """
    Модель для связи пользователя и организации с дополнительными атрибутами.
    Определяет роль, статус подтверждения и другие метаданные.
    """

    class Role(models.TextChoices):
        ADMIN = 'admin', _('Администратор')
        MANAGER = 'manager', _('Менеджер')
        MEMBER = 'member', _('Сотрудник')
        GUEST = 'guest', _('Гость')

    class Status(models.TextChoices):
        APPROVED = 'approved', _('Подтверждено')
        PENDING = 'pending', _('Ожидает подтверждения')
        REJECTED = 'rejected', _('Отклонено')

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        verbose_name=_('Пользователь'),
        related_name='organization_memberships'
    )

    organization = models.ForeignKey(
        ExternalOrganization,
        on_delete=models.CASCADE,
        verbose_name=_('Организация'),
        related_name='user_memberships'
    )

    role = models.CharField(
        _('Роль'),
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBER
    )

    status = models.CharField(
        _('Статус'),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    joined_at = models.DateTimeField(
        _('Дата вступления'),
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        _('Дата обновления'),
        auto_now=True
    )

    class Meta:
        verbose_name = _('Членство в организации')
        verbose_name_plural = _('Членства в организациях')
        unique_together = ('user', 'organization')  # Один пользователь — одна организация



class Farm(models.Model):
    """
    Модель фермы/хозяйства.

    Атрибуты:
        name (CharField): Название фермы (уникальное).
        owner (ForeignKey): Владелец фермы, который является пользователем.
        organization (ForeignKey): Внешняя организация, связанная с фермой.
        created_at (DateTimeField): Дата и время создания фермы.
        updated_at (DateTimeField): Дата и время последнего обновления фермы.
        description (TextField): Описание фермы.
    """

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

    organization = models.ForeignKey(
        'ExternalOrganization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='farms',
        verbose_name=_('Организация'),
        help_text=_('Связанная внешняя организация')
    )

    slug = models.SlugField(
        _('Slug'),
        blank=True,
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

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super(Farm, self).save(*args, **kwargs)


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

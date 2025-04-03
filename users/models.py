from django.db import models
from django.contrib.auth.models import AbstractUser

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
        help_text="Номер телефона пользователя"
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

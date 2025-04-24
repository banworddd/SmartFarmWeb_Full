from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser,
    Farm,
    FarmGroup,
    FarmMembership, ExternalOrganization,
)


class CustomUserAdmin(UserAdmin):
    list_display = ('phone_number', 'email', 'first_name', 'last_name', 'is_staff')
    search_fields = ('phone_number', 'email', 'first_name', 'last_name')
    ordering = ('phone_number',)
    fieldsets = (
        (None, {'fields': ('phone_number', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number', 'password1', 'password2', 'first_name', 'last_name', 'email'),
        }),
    )

class FarmAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'created_at')
    list_filter = ('owner',)
    search_fields = ('name', 'description')
    raw_id_fields = ('owner',)

class FarmGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'farm', 'description')
    list_filter = ('farm',)
    filter_horizontal = ('permissions',)

class FarmMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'farm', 'role', 'joined_at')
    list_filter = ('farm', 'role')
    search_fields = ('user__phone_number', 'user__email')

class ExternalOrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'slug', 'address', 'email', 'description')
    list_filter = ('name',)
    search_fields = ('slug',)


# Регистрация моделей
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Farm, FarmAdmin)
admin.site.register(FarmGroup, FarmGroupAdmin)
admin.site.register(FarmMembership, FarmMembershipAdmin)
admin.site.register(ExternalOrganization, ExternalOrganizationAdmin)

from django.db.models import Q
from rest_framework import permissions

from users.models import ExternalOrganizationMembership, ExternalOrganization

class IsOrganizationMember(permissions.BasePermission):
    """
    Разрешает доступ только членам организации.
    """

    def has_permission(self, request, view):
        organization_slug = request.query_params.get('slug') or request.query_params.get('organization')

        if not organization_slug:
            return False

        return request.user.organization_memberships.filter(
            organization=ExternalOrganization.objects.get(slug=organization_slug),
            status=ExternalOrganizationMembership.Status.APPROVED
        ).exists()

    def has_object_permission(self, request, view, obj):
        organization = obj.organization if obj.organization else obj

        return request.user.organization_memberships.filter(
            organization=organization,
            status=ExternalOrganizationMembership.Status.APPROVED
        ).exists()


class IsOrganizationAdmin(permissions.BasePermission):
    """Разрешает доступ только админам"""

    def has_permission(self, request, view):
        organization_slug = (
            request.query_params.get('slug')
            or request.query_params.get('organization')
        )

        if not organization_slug:
            return False

        return request.user.organization_memberships.filter(
            organization=ExternalOrganization.objects.get(slug=organization_slug),
            status=ExternalOrganizationMembership.Status.APPROVED,
            role=ExternalOrganizationMembership.Role.ADMIN
                ).exists()

    def has_object_permission(self, request, view, obj):
        organization = obj.organization if obj.organization else obj

        return request.user.organization_memberships.filter(
            organization=organization,
            status=ExternalOrganizationMembership.Status.APPROVED,
            role=ExternalOrganizationMembership.Role.ADMIN
        ).exists()
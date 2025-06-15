from rest_framework.filters import OrderingFilter
from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView, RetrieveAPIView, UpdateAPIView, CreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import IntegrityError


from .serializers import (
FarmSerializer, FarmMembershipsSerializer, ZoneSerializer
)
from users.models import (
    FarmMembership,
    ExternalOrganization,
    Farm,
    CustomUser,
    ExternalOrganizationMembership,
)

from dashboard.models import (
    Zone
)
from ..ProfilePage.serializers import CustomUserProfileSerializer
from ..UserPages.serializers import UserExternalOrganizationSerializer


class FarmAPIView(RetrieveUpdateAPIView):
    serializer_class = FarmSerializer
    permission_classes = [IsAuthenticated]


    def get_object(self):
        slug = self.request.query_params.get('slug')
        return Farm.objects.filter(slug=slug).first()

class FarmOrganizationAPIView(RetrieveAPIView):
    serializer_class = UserExternalOrganizationSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        slug = self.request.query_params.get('slug')
        return ExternalOrganization.objects.filter(farms__slug=slug).first()


class FarmMembershipsAPIView(ListAPIView):
    serializer_class = FarmMembershipsSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [OrderingFilter]
    ordering_fields = ['role', 'user__last_name']
    ordering = ['role']

    def get_queryset(self):
        slug = self.request.query_params.get('slug')
        return FarmMembership.objects.filter(farm__slug=slug)


class FarmMembershipUpdateAPIView(UpdateAPIView):
    serializer_class = FarmMembershipsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        membership_id = self.request.query_params.get('id')
        return FarmMembership.objects.filter(
            id=membership_id,
        ).first()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            return Response(
                {"error": "Farm membership not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        if instance.role == 'owner':
            return Response(
                {"error": "Cannot change owner's role"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)


class FarmMembershipCreateAPIView(CreateAPIView):
    serializer_class = FarmMembershipsSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Получаем farm по slug
        farm = get_object_or_404(Farm, slug=request.query_params.get('slug'))
        
        # Получаем пользователя по email
        user_email = request.data.get('user_email')
        if not user_email:
            return Response(
                {"error": "user_email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user = get_object_or_404(CustomUser, email=user_email)
        
        # Проверяем, что пользователь уже не является членом фермы
        if FarmMembership.objects.filter(farm=farm, user=user).exists():
            return Response(
                {"error": "User is already a member of this farm"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Получаем организацию фермы
        org = farm.organization
        if not org:
            return Response(
                {"error": "Farm has no parent organization"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Проверяем, что пользователь является членом организации
        if not ExternalOrganizationMembership.objects.filter(
            organization=org,
            user=user
        ).exists():
            return Response(
                {"error": "User must be a member of the parent organization first"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Создаем новое членство
        try:
            membership = FarmMembership.objects.create(
                farm=farm,
                user=user,
                role=request.data.get('role', 'viewer')  # По умолчанию viewer
            )
            serializer = self.get_serializer(membership)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response(
                {"error": "Failed to create membership"},
                status=status.HTTP_400_BAD_REQUEST
            )


class AvailableFarmUsersAPIView(ListAPIView):
    serializer_class = CustomUserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        farm = get_object_or_404(Farm, slug=self.request.query_params.get('slug'))
        organization = farm.organization

        if not organization:
            return CustomUser.objects.none()

        # Получаем всех пользователей организации через organization_memberships
        org_users = CustomUser.objects.filter(organization_memberships__organization=organization)
        
        # Получаем всех пользователей фермы
        farm_users = CustomUser.objects.filter(farmmembership__farm=farm)
        
        # Исключаем пользователей, которые уже есть в ферме
        return org_users.exclude(id__in=farm_users.values_list('id', flat=True))


class FarmZonesAPIView(ListAPIView):
    serializer_class = ZoneSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        farm_slug = self.request.query_params.get('slug')
        farm = get_object_or_404(Farm, slug=farm_slug)
        return Zone.objects.filter(farm=farm)


class ZoneUpdateAPIView(RetrieveUpdateAPIView):
    serializer_class = ZoneSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Zone.objects.all()

    def get_object(self):
        zone_id = self.request.query_params.get('id')
        return get_object_or_404(Zone, id=zone_id)


class ZoneCreateAPIView(CreateAPIView):
    serializer_class = ZoneSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        farm_slug = request.query_params.get('slug')
        farm = get_object_or_404(Farm, slug=farm_slug)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(farm=farm) # Связываем зону с фермой

        return Response(serializer.data, status=status.HTTP_201_CREATED)





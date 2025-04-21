from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Farm, FarmMembership

@receiver(post_save, sender=Farm)
def create_owner_membership(sender, instance, created, **kwargs):
    if created:
        FarmMembership.objects.create(
            user=instance.owner,
            farm=instance,
            role=FarmMembership.Role.OWNER
        )

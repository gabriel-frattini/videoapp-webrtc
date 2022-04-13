from rest_framework.serializers import ModelSerializer
from .models import Image

class ScreenshotCreateSerializer(ModelSerializer):
    class Meta:
        model = Image
        fields = (
            'image', 'username'
        )
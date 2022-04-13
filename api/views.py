from django.shortcuts import render, redirect
# from django.core.files import File
# from django.core.files.base import ContentFile
# from django.core.files.temp import NamedTemporaryFile
# Create your views here.
from rest_framework.views import APIView
from .serializer import ScreenshotCreateSerializer
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, FileUploadParser
from rest_framework.response import Response
from rest_framework import status


class SaveScreenshot(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        print(request.data)
        serializer = ScreenshotCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def home_view(request):
    return render(request, 'index.html', {})

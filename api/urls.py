from django import views
from django.urls import path
from .views import SaveScreenshot, home_view
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', home_view, name="home"),
    path('api/save_screenshot/', SaveScreenshot.as_view(), name='save-screenshot')
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

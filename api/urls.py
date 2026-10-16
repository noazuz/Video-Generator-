from django.urls import path
from .views import generate_video_api

urlpatterns = [
    path('generate-video/', generate_video_api, name='generate-video'),
]
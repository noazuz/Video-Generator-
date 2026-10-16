import os
import asyncio
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import VideoProject
import edge_tts
from mutagen.mp3 import MP3

async def generate_tts_async(text, output_path, voice_name="uk-UA-OstapNeural"):
    voice_map = {
        "Остап": "uk-UA-OstapNeural",
        "Поліна": "uk-UA-PolinaNeural",
    }
    selected_voice = voice_map.get(voice_name, "uk-UA-OstapNeural")
    
    communicate = edge_tts.Communicate(text, selected_voice)
    await communicate.save(output_path)

@api_view(['POST'])
def generate_video_api(request):
    data = request.data
    
    topic = data.get('topic', '')
    script = data.get('script', '')
    format_type = data.get('format', '9:16')
    duration = data.get('duration', 30)
    tone = data.get('tone', 'Натхненний')
    voice = data.get('voice', 'Остап')
    music = data.get('music', 'Без музики')

    if not topic:
        return Response({"error": "Тема відео обов'язкова!"}, status=status.HTTP_400_BAD_REQUEST)

    project = VideoProject.objects.create(
        title=topic[:70],
        topic=topic,
        script=script,
        format_type=format_type,
        duration=duration,
        tone=tone,
        voice=voice,
        music=music,
        status='ready'
    )

    media_dir = os.path.join(settings.BASE_DIR, 'media', 'generated')
    os.makedirs(media_dir, exist_ok=True)
    
    audio_filename = f"project_{project.id}_voice.mp3"
    audio_path = os.path.join(media_dir, audio_filename)

    text_to_speak = script if script else topic
    try:
        asyncio.run(generate_tts_async(text_to_speak, audio_path, voice))
    except Exception as e:
        return Response({"error": f"Помилка генерації голосу: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    audio_duration = duration  
    try:
        audio = MP3(audio_path)
        audio_duration = round(audio.info.length)
    except Exception as e:
        print(f"Не вдалося визначити тривалість аудіо: {e}")

    return Response({
        "status": "success",
        "message": "Відео та озвучку успішно згенеровано!",
        "project_id": project.id,
        "audio_url": f"/media/generated/{audio_filename}",
        "duration": audio_duration  
    }, status=status.HTTP_201_CREATED)
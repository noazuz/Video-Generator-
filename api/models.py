from django.db import models

class VideoProject(models.Model):
    title = models.CharField(max_length=255, default="Без назви")
    topic = models.TextField()                   
    script = models.TextField()                   
    format_type = models.CharField(max_length=20, default="9:16") 
    duration = models.IntegerField(default=30)    
    tone = models.CharField(max_length=50, default="Натхненний")
    voice = models.CharField(max_length=50, default="Остап")   
    music = models.CharField(max_length=100, default="Без музики") 
    status = models.CharField(max_length=20, default="ready")    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
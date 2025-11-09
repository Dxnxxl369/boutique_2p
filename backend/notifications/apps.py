from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'

    def ready(self):
        import notifications.signals  # noqa
        
        # Initialize Firebase Admin SDK
        try:
            import firebase_admin
            from firebase_admin import credentials
            from django.conf import settings
            
            if not firebase_admin._apps: # Check if Firebase is already initialized
                cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)
                firebase_admin.initialize_app(cred)
                print("Firebase Admin SDK initialized successfully.")
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK: {e}")
            # Log the error, but don't prevent the app from starting

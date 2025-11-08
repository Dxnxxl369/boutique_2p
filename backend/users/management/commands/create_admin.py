from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create an admin user for the boutique system'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, default='admin', help='Username for admin')
        parser.add_argument('--email', type=str, default='admin@boutique.com', help='Email for admin')
        parser.add_argument('--password', type=str, default='admin123', help='Password for admin')
        parser.add_argument('--first-name', type=str, default='Admin', help='First name')
        parser.add_argument('--last-name', type=str, default='Boutique', help='Last name')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'User "{username}" already exists')
            )
            return

        # Create admin user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='admin',
            is_staff=True,
            is_superuser=True,
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created admin user: {username}')
        )
        self.stdout.write(f'Username: {username}')
        self.stdout.write(f'Email: {email}')
        self.stdout.write(f'Password: {password}')
        self.stdout.write(f'Role: admin')

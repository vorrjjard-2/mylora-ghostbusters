import csv
import secrets
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from django.db import transaction
from accounts.models import UserProfile


ROLE_MAP = {
    'upper management': 'upper_management',
    'credit manager': 'credit_manager',
    'order processor': 'order_processor',
}


def clean(val):
    return val.strip() if val else ''


class Command(BaseCommand):
    help = 'Import employees from a CSV file'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file')
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what would be imported without saving',
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        dry_run = options['dry_run']

        created = 0
        skipped = 0
        errors = []

        with open(csv_file, newline='', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            rows = list(reader)

        # Row 0 is the header, data starts at row 1
        for i, cols in enumerate(rows[1:], start=2):
            if not any(c.strip() for c in cols):
                continue

            while len(cols) < 4:
                cols.append('')

            role_raw = clean(cols[0])
            first_name = clean(cols[1])
            last_name = clean(cols[2])
            email = clean(cols[3])

            if not email or not first_name or not last_name:
                errors.append(f'Row {i}: Missing name or email, skipping')
                skipped += 1
                continue

            group_name = ROLE_MAP.get(role_raw.lower())
            if not group_name:
                errors.append(f'Row {i}: Unknown role "{role_raw}", skipping')
                skipped += 1
                continue

            if User.objects.filter(username=email).exists():
                self.stdout.write(f'Row {i}: {email} already exists, skipping')
                skipped += 1
                continue

            if dry_run:
                self.stdout.write(
                    f'[DRY RUN] Row {i}: {first_name} {last_name} ({email}), '
                    f'role: {group_name}'
                )
                created += 1
                continue

            temp_password = secrets.token_urlsafe(12)

            try:
                with transaction.atomic():
                    user = User.objects.create_user(
                        username=email,
                        email=email,
                        password=temp_password,
                        first_name=first_name,
                        last_name=last_name,
                    )
                    group, _ = Group.objects.get_or_create(name=group_name)
                    user.groups.add(group)

                    UserProfile.objects.create(
                        user=user,
                        must_change_password=True,
                    )

                self.stdout.write(self.style.SUCCESS(
                    f'Row {i}: Created {first_name} {last_name} ({email}) '
                    f'| role: {group_name} | password: {temp_password}'
                ))
                created += 1

            except Exception as e:
                errors.append(f'Row {i}: {e}')
                skipped += 1

        self.stdout.write('')
        self.stdout.write(f'Created: {created}')
        self.stdout.write(f'Skipped: {skipped}')
        if errors:
            self.stdout.write(self.style.WARNING('Errors:'))
            for err in errors:
                self.stdout.write(f'  {err}')

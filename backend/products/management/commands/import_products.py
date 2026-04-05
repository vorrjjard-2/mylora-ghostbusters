import csv
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from products.models import Product
from accounts.models import Branch


class Command(BaseCommand):
    help = 'Import products from CSV using F0 pricing for all branches'

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

        branches = list(Branch.objects.all())
        if not branches:
            self.stderr.write(self.style.ERROR('No branches found. Seed branches first.'))
            return

        self.stdout.write(f'Branches: {", ".join(b.name for b in branches)}')

        with open(csv_file, newline='', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            rows = list(reader)

        # Row 0 is header: Product Name, Bag Size (kg), ..., Cebu - F0, ...
        # F0 price is column index 3
        COL_NAME = 0
        COL_BAG_SIZE = 1
        COL_F0_PRICE = 3

        created = 0
        skipped = 0

        for i, cols in enumerate(rows[1:], start=2):
            if len(cols) < 4:
                continue

            name = cols[COL_NAME].strip()
            bag_size = cols[COL_BAG_SIZE].strip()
            f0_price_str = cols[COL_F0_PRICE].strip().replace(',', '').replace(' ', '')

            if not name or not f0_price_str:
                self.stdout.write(f'Row {i}: {name or "(empty)"} — no F0 price, skipping')
                skipped += 1
                continue

            try:
                price = Decimal(f0_price_str)
            except Exception:
                self.stdout.write(f'Row {i}: {name} — invalid F0 price "{cols[COL_F0_PRICE].strip()}", skipping')
                skipped += 1
                continue

            unit = f'{bag_size}kg' if bag_size else 'pc'

            for branch in branches:
                if dry_run:
                    self.stdout.write(f'[DRY RUN] {name} | {unit} | ₱{price} | {branch.name}')
                else:
                    with transaction.atomic():
                        Product.objects.create(
                            name=name,
                            unit_price=price,
                            unit=unit,
                            branch=branch,
                        )
                created += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Created: {created} product entries'))
        self.stdout.write(f'Skipped: {skipped} rows (no F0 price)')

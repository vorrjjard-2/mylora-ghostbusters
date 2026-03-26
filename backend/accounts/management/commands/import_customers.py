import csv
import secrets
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from django.db import transaction
from accounts.models import Customer, Branch, CreditAccount
from applications.models import CreditEnrollment


# Column indices based on the CSV layout (0-indexed):
# 0: #
# 1: Email Address
# 2: First Name
# 3: Last Name
# 4: Phone Number
# 5: Delivery Address 1
# 6: Delivery Address 2
# 7: Delivery Province
# 8: Delivery City/Municipality
# 9: Delivery Barangay
# 10: Delivery Zip Code
# 11: Billing Address 1
# 12: Billing Address 2
# 13: Billing Province
# 14: Billing City/Municipality
# 15: Billing Barangay
# 16: Billing Zip Code
# 17: Credit Amount
# 18: Credit Terms
# 19: Preferred Branch

COL_EMAIL = 1
COL_FIRST = 2
COL_LAST = 3
COL_PHONE = 4
COL_D_ADDR1 = 5
COL_D_ADDR2 = 6
COL_D_PROV = 7
COL_D_CITY = 8
COL_D_BGY = 9
COL_D_ZIP = 10
COL_B_ADDR1 = 11
COL_B_ADDR2 = 12
COL_B_PROV = 13
COL_B_CITY = 14
COL_B_BGY = 15
COL_B_ZIP = 16
COL_CREDIT_AMT = 17
COL_CREDIT_TERM = 18
COL_BRANCH = 19


def clean(val):
    return val.strip() if val else ''


class Command(BaseCommand):
    help = 'Import customers from a CSV file'

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

        branches = {b.name.lower(): b for b in Branch.objects.all()}
        customer_group, _ = Group.objects.get_or_create(name='customer')

        created = 0
        skipped = 0
        errors = []

        with open(csv_file, newline='', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            rows = list(reader)

        # Skip row 0 (group header) and row 1 (column header), data starts at row 2
        for i, cols in enumerate(rows[2:], start=3):
            # Skip empty rows
            if not any(c.strip() for c in cols):
                continue

            # Pad columns if needed
            while len(cols) < 20:
                cols.append('')

            email = clean(cols[COL_EMAIL])
            first_name = clean(cols[COL_FIRST])
            last_name = clean(cols[COL_LAST])
            phone = clean(cols[COL_PHONE])

            if not email or not first_name or not last_name:
                errors.append(f'Row {i}: Missing name or email, skipping')
                skipped += 1
                continue

            if User.objects.filter(username=email).exists():
                self.stdout.write(f'Row {i}: {email} already exists, skipping')
                skipped += 1
                continue

            # Delivery address
            d_addr1 = clean(cols[COL_D_ADDR1])
            d_addr2 = clean(cols[COL_D_ADDR2])
            d_province = clean(cols[COL_D_PROV])
            d_city = clean(cols[COL_D_CITY])
            d_barangay = clean(cols[COL_D_BGY])
            d_zip = clean(cols[COL_D_ZIP])

            # Billing address
            b_addr1 = clean(cols[COL_B_ADDR1])
            b_addr2 = clean(cols[COL_B_ADDR2])
            b_province = clean(cols[COL_B_PROV])
            b_city = clean(cols[COL_B_CITY])
            b_barangay = clean(cols[COL_B_BGY])
            b_zip = clean(cols[COL_B_ZIP])

            # Credit info
            credit_amt_str = clean(cols[COL_CREDIT_AMT]).replace(',', '').replace(' ', '')
            credit_term_str = clean(cols[COL_CREDIT_TERM])
            branch_name = clean(cols[COL_BRANCH])

            try:
                credit_amount = Decimal(credit_amt_str)
            except Exception:
                errors.append(f'Row {i}: Invalid credit amount "{cols[COL_CREDIT_AMT].strip()}"')
                skipped += 1
                continue

            # Parse credit term
            credit_term_days = 30
            for part in credit_term_str.replace('days', '').split('/'):
                part = part.strip()
                if part.isdigit():
                    credit_term_days = int(part)
                    break

            # Match branch
            branch = branches.get(branch_name.lower())
            if not branch:
                errors.append(f'Row {i}: Unknown branch "{branch_name}", skipping')
                skipped += 1
                continue

            if dry_run:
                self.stdout.write(
                    f'[DRY RUN] Row {i}: {first_name} {last_name} ({email}), '
                    f'credit: {credit_amount}, term: {credit_term_days}d, '
                    f'branch: {branch.name}'
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
                    user.groups.add(customer_group)

                    enrollment = CreditEnrollment.objects.create(
                        first_name=first_name,
                        last_name=last_name,
                        phone_number=phone,
                        email=email,
                        address1=d_addr1,
                        address2=d_addr2,
                        province=d_province,
                        city=d_city,
                        barangay=d_barangay,
                        zipcode=d_zip,
                        billing_address1=b_addr1,
                        billing_address2=b_addr2,
                        billing_province=b_province,
                        billing_city=b_city,
                        billing_barangay=b_barangay,
                        billing_zipcode=b_zip,
                        branch=branch,
                        credit_amt_request=credit_amount,
                        credit_term_request=str(credit_term_days),
                        enrollment_status='APPROVED',
                        account_activated=True,
                        doc1_file='',
                        doc2_file='',
                        gov_id='',
                    )

                    customer = Customer.objects.create(
                        user=user,
                        application=enrollment,
                        must_change_password=True,
                    )

                    CreditAccount.objects.create(
                        customer=customer,
                        branch=branch,
                        credit_limit=credit_amount,
                        available_credit=credit_amount,
                        outstanding_bal=Decimal('0.00'),
                        credit_term=credit_term_days,
                        status='ACTIVE',
                    )

                self.stdout.write(self.style.SUCCESS(
                    f'Row {i}: Created {first_name} {last_name} ({email}) '
                    f'| password: {temp_password}'
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

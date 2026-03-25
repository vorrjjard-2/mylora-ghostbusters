from django.db import migrations


def ensure_branches(apps, schema_editor):
    Branch = apps.get_model('accounts', 'Branch')
    for name, address in [
        ('Compostela', 'Compostela, Cebu'),
        ('Naga', 'Naga, Cebu'),
        ('Argao', 'Argao, Cebu'),
    ]:
        Branch.objects.get_or_create(name=name, defaults={'address': address})


def reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0011_seed_branches'),
    ]

    operations = [
        migrations.RunPython(ensure_branches, reverse),
    ]

from django.db import migrations


def seed_branches(apps, schema_editor):
    Branch = apps.get_model('accounts', 'Branch')
    # Rename existing branches to the real branch names
    mapping = {
        1: ('Compostela', 'Compostela, Cebu'),
        2: ('Naga', 'Naga, Cebu'),
        3: ('Argao', 'Argao, Cebu'),
    }
    for branch_id, (name, address) in mapping.items():
        Branch.objects.filter(branch_id=branch_id).update(name=name, address=address)


def reverse_seed(apps, schema_editor):
    Branch = apps.get_model('accounts', 'Branch')
    mapping = {
        1: ('branch-b', ''),
        2: ('branch-a', ''),
        3: ('Main Branch Mylora', ''),
    }
    for branch_id, (name, address) in mapping.items():
        Branch.objects.filter(branch_id=branch_id).update(name=name, address=address)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_creditincreaserequest'),
    ]

    operations = [
        migrations.RunPython(seed_branches, reverse_seed),
    ]

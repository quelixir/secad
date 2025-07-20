import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function migrateIdentifiers() {
  console.log('Starting identifier migration...');

  try {
    // This script would migrate existing data if there were any
    // Since we reset the database, we'll just seed with the new structure

    // Get or create a sample entity with identifiers
    const existingEntity = await prisma.entity.findFirst();
    if (!existingEntity) {
      const entity = await prisma.entity.create({
        data: {
          name: 'Test Entity Pty Ltd',
          entityTypeId: 'rptlh9fl9ncd3rd5pwa4cwbt', // LMSH_PROP
          incorporationDate: new Date('2024-01-01'),
          incorporationCountry: 'Australia',
          incorporationState: 'NSW',
          address: '123 Test Street',
          city: 'Sydney',
          state: 'NSW',
          postcode: '2000',
          country: 'Australia',
          status: 'Active',
          email: 'test@example.com',
          phone: '+61 2 1234 5678',
          website: 'https://example.com',
        },
      });
      console.log('Created sample entity with identifiers:', entity.name);
      console.log('Identifiers:', (entity as any).identifiers);
    }

    console.log('Identifier migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateIdentifiers()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });

import { PrismaClient } from '../lib/generated/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function seedDemoData() {
  console.log('Starting demo data seed...');

  try {
    // Create demo entities
    const entities = await createDemoEntities();

    // Create demo members for each entity
    for (const entity of entities) {
      await createDemoMembers(entity.id);
    }

    // Create demo security classes
    for (const entity of entities) {
      await createDemoSecurityClasses(entity.id);
    }

    // Create demo transactions
    for (const entity of entities) {
      await createDemoTransactions(entity.id);
    }

    console.log('Demo data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createDemoEntities() {
  console.log('📋 Creating demo entities...');

  const entityData = [
    {
      name: 'Janus Syndicate Ltd',
      entityTypeId: 'rptlh9fl9ncd3rd5pwa4cwbt', // LMSH_PROP
      incorporationDate: new Date('1997-08-25'),
      incorporationCountry: 'Australia',
      incorporationState: 'NSW',
      address: '007 Secret Service Lane',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      country: 'Australia',
      status: 'Active',
      email: 'admin@janussyndicate.com.au',
      phone: '+61 2 0070 0070',
      website: 'https://janussyndicate.com.au',
      identifiers: [
        { type: 'ABN', value: '00700700701', country: 'Australia' },
        { type: 'ACN', value: '007007007', country: 'Australia' },
      ],
    },
    {
      name: 'Severnaya Station Pty Ltd',
      entityTypeId: 'rptlh9fl9ncd3rd5pwa4cwbt', // LMSH_PROP
      incorporationDate: new Date('1997-06-15'),
      incorporationCountry: 'Australia',
      incorporationState: 'VIC',
      address: '456 Siberian Street',
      city: 'Melbourne',
      state: 'VIC',
      postcode: '3000',
      country: 'Australia',
      status: 'Active',
      email: 'info@severnaya.com.au',
      phone: '+61 3 0070 0070',
      website: 'https://severnaya.com.au',
      identifiers: [
        { type: 'ABN', value: '00700700702', country: 'Australia' },
        { type: 'ACN', value: '007007008', country: 'Australia' },
      ],
    },
    {
      name: 'Archangel Defence Systems Ltd',
      entityTypeId: 'd2013bnn9cl0u3uqkkz1748c', // LMSH_PROP
      incorporationDate: new Date('1997-03-10'),
      incorporationCountry: 'Australia',
      incorporationState: 'QLD',
      address: '789 GoldenEye Boulevard',
      city: 'Brisbane',
      state: 'QLD',
      postcode: '4000',
      country: 'Australia',
      status: 'Active',
      email: 'contact@archangel.com.au',
      phone: '+61 7 0070 0070',
      website: 'https://archangel.com.au',
      identifiers: [
        { type: 'ABN', value: '26164314489', country: 'Australia' },
        { type: 'ACN', value: '164314489', country: 'Australia' },
      ],
    },
  ];

  const entities = [];
  for (const data of entityData) {
    const { identifiers, ...entityDataWithoutIdentifiers } = data;

    // Check if entity already exists by name
    let entity = await prisma.entity.findFirst({
      where: { name: data.name },
      include: { identifiers: true },
    });

    if (!entity) {
      entity = await prisma.entity.create({
        data: {
          ...entityDataWithoutIdentifiers,
          identifiers: {
            create: identifiers.map((id) => ({
              ...id,
              isActive: true,
            })),
          },
        },
        include: {
          identifiers: true,
        },
      });
      console.log(`✅ Created entity: ${entity.name}`);
    } else {
      console.log(`ℹ️ Entity already exists: ${entity.name}`);
    }

    entities.push(entity);
  }

  return entities;
}

async function createDemoMembers(entityId: string) {
  console.log(`👥 Creating demo members for entity ${entityId}...`);

  const memberData = [
    {
      firstName: 'James',
      lastName: 'Bond',
      memberType: 'INDIVIDUAL',
      email: 'james.bond@mi6.gov.uk',
      phone: '+61 412 007 007',
      memberNumber: 'M001',
      address: '007 Secret Service Lane',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      country: 'Australia',
      joinDate: new Date('1997-08-25'),
      status: 'Active',
      tfn: '007007007',
    },
    {
      firstName: 'Alec',
      lastName: 'Trevelyan',
      memberType: 'INDIVIDUAL',
      email: 'alec.trevelyan@janus.com',
      phone: '+61 423 006 006',
      memberNumber: 'M002',
      designation: '<Former Agent Investment A/C>',
      address: '456 Former Agent Street',
      city: 'Melbourne',
      state: 'VIC',
      postcode: '3000',
      country: 'Australia',
      joinDate: new Date('1997-08-25'),
      status: 'Active',
      tfn: '006006006',
    },
    {
      entityName: 'MI6 Holdings Pty Ltd',
      memberType: 'COMPANY',
      email: 'admin@mi6holdings.com.au',
      phone: '+61 2 0070 0070',
      memberNumber: 'M003',
      address: '789 Intelligence Avenue',
      city: 'Canberra',
      state: 'ACT',
      postcode: '2600',
      country: 'Australia',
      joinDate: new Date('1997-08-25'),
      status: 'Active',
      abn: '00700700704',
    },
    {
      firstName: 'Natalya',
      lastName: 'Simonova',
      memberType: 'INDIVIDUAL',
      email: 'natalya.simonova@severnaya.com',
      phone: '+61 434 005 005',
      memberNumber: 'M004',
      address: '123 Siberian Street',
      city: 'Brisbane',
      state: 'QLD',
      postcode: '4000',
      country: 'Australia',
      joinDate: new Date('1997-06-15'),
      status: 'Active',
      tfn: '005005005',
    },
    {
      entityName: 'GoldenEye Holdings Pty Ltd',
      memberType: 'COMPANY',
      email: 'trustee@goldeneye.com.au',
      phone: '+61 445 004 004',
      memberNumber: 'M005',
      designation: '<Ourumov Family A/C>',
      address: '555 GoldenEye Boulevard',
      city: 'Perth',
      state: 'WA',
      postcode: '6000',
      country: 'Australia',
      joinDate: new Date('1997-03-10'),
      status: 'Active',
    },
  ];

  for (const data of memberData) {
    await prisma.member.upsert({
      where: {
        entityId_memberNumber: {
          entityId,
          memberNumber: data.memberNumber,
        },
      },
      update: {},
      create: {
        ...data,
        entityId,
        country: 'Australia',
      },
    });
  }

  console.log(`✅ Created ${memberData.length} members`);
}

async function createDemoSecurityClasses(entityId: string) {
  console.log(`📈 Creating demo security classes for entity ${entityId}...`);

  const securityClassData = [
    {
      name: 'Ordinary Shares',
      symbol: 'ORD',
      description: 'Ordinary voting shares with full rights',
      votingRights: true,
      dividendRights: true,
      isActive: true,
    },
    {
      name: 'Preference Shares',
      symbol: 'PREF',
      description: 'Preference shares with priority dividend rights',
      votingRights: false,
      dividendRights: true,
      isActive: true,
    },
    {
      name: 'Employee Options',
      symbol: 'OPT',
      description: 'Employee share options',
      votingRights: false,
      dividendRights: false,
      isActive: true,
    },
  ];

  for (const data of securityClassData) {
    await prisma.securityClass.upsert({
      where: {
        entityId_name: {
          entityId,
          name: data.name,
        },
      },
      update: {},
      create: {
        ...data,
        entityId,
      },
    });
  }

  console.log(`✅ Created ${securityClassData.length} security classes`);
}

async function createDemoTransactions(entityId: string) {
  console.log(`💼 Creating demo transactions for entity ${entityId}...`);

  // Get security classes and members
  const securityClasses = await prisma.securityClass.findMany({
    where: { entityId },
  });

  const members = await prisma.member.findMany({
    where: { entityId },
  });

  if (securityClasses.length === 0 || members.length === 0) {
    console.log(
      '⚠️ Skipping transactions - no security classes or members found'
    );
    return;
  }

  const transactionData = [
    // Initial share issues
    {
      transactionType: 'ISSUE',
      securityClassId: securityClasses[0].id, // Ordinary Shares
      quantity: 1000,
      reasonCode: 'BON',
      amountPaidPerSecurity: new Decimal('1.00'),
      amountUnpaidPerSecurity: new Decimal('0.00'),
      currency: 'AUD',
      totalAmountPaid: new Decimal('1000.00'),
      totalAmountUnpaid: new Decimal('0.00'),
      toMemberId: members[0].id,
      trancheNumber: 'T001',
      trancheSequence: 1,
      transactionDate: new Date('1997-08-25'),
      settlementDate: new Date('1997-08-25'),
      reference: 'BOND-001',
      description: 'Initial share issue upon entity incorporation',
      status: 'Completed',
    },
    {
      transactionType: 'ISSUE',
      securityClassId: securityClasses[0].id, // Ordinary Shares
      quantity: 500,
      reasonCode: 'BON',
      amountPaidPerSecurity: new Decimal('1.00'),
      amountUnpaidPerSecurity: new Decimal('0.00'),
      currency: 'AUD',
      totalAmountPaid: new Decimal('500.00'),
      totalAmountUnpaid: new Decimal('0.00'),
      toMemberId: members[1].id,
      trancheNumber: 'T001',
      trancheSequence: 2,
      transactionDate: new Date('1997-08-25'),
      settlementDate: new Date('1997-08-25'),
      reference: 'TREV-001',
      description: 'Share issue to former agent',
      status: 'Completed',
    },
    // Share transfer
    {
      transactionType: 'TRANSFER',
      securityClassId: securityClasses[0].id,
      quantity: 200,
      reasonCode: 'TRF',
      transferPricePerSecurity: new Decimal('1.50'),
      currency: 'AUD',
      totalTransferAmount: new Decimal('300.00'),
      fromMemberId: members[0].id,
      toMemberId: members[2].id,
      trancheNumber: 'T002',
      trancheSequence: 1,
      transactionDate: new Date('1997-09-01'),
      settlementDate: new Date('1997-09-01'),
      reference: 'MI6-001',
      description: 'Share transfer to MI6 Holdings',
      status: 'Completed',
    },
    // Preference share issue
    {
      transactionType: 'ISSUE',
      securityClassId: securityClasses[1].id, // Preference Shares
      quantity: 300,
      reasonCode: 'BON',
      amountPaidPerSecurity: new Decimal('2.00'),
      amountUnpaidPerSecurity: new Decimal('0.00'),
      currency: 'AUD',
      totalAmountPaid: new Decimal('600.00'),
      totalAmountUnpaid: new Decimal('0.00'),
      toMemberId: members[3].id,
      trancheNumber: 'T003',
      trancheSequence: 1,
      transactionDate: new Date('1997-06-15'),
      settlementDate: new Date('1997-06-15'),
      reference: 'NAT-001',
      description: 'Preference share issue to programmer',
      status: 'Completed',
    },
  ];

  for (const data of transactionData) {
    await prisma.transaction.create({
      data: {
        ...data,
        entityId,
      },
    });
  }

  console.log(`✅ Created ${transactionData.length} transactions`);
}

// Run the seed function
seedDemoData().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});

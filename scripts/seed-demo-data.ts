import {
  EntityStatus,
  MemberStatus,
  MemberType,
  TransactionStatus,
} from '@/lib/types';
import { PrismaClient } from '../lib/generated/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { australiaCompliancePack } from '@/lib/compliance/australia';

const prisma = new PrismaClient();

async function seedDemoData() {
  console.log('🏁 Starting demo data seed...');

  try {
    // Create demo user
    const demoUser = await createDemoUser();

    // Create demo entities
    const entities = await createDemoEntities();

    // Grant demo user admin access to all entities
    if (demoUser && entities.length > 0) {
      for (const entity of entities) {
        await prisma.userEntityAccess.upsert({
          where: {
            userId_entityId: {
              userId: demoUser.id,
              entityId: entity.id,
            },
          },
          update: { role: 'Admin' },
          create: {
            userId: demoUser.id,
            entityId: entity.id,
            role: 'Admin',
          },
        });
      }
      console.log('✅ Granted demo user admin access to all demo entities');
    }

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

    // Create demo event logs
    for (const entity of entities) {
      await createDemoEventLogs(entity.id);
    }

    console.log('✅ Demo data seeding completed successfully!');
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
      name: 'Janus Syndicate Pty Limited',
      entityTypeId: 'rptlh9fl9ncd3rd5pwa4cwbt', // LMSH_PROP
      incorporationDate: new Date('1997-08-25'),
      incorporationCountry: 'Australia',
      incorporationState: 'NSW',
      address: '007 Secret Service Lane',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      country: 'Australia',
      status: EntityStatus.ACTIVE,
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
      status: EntityStatus.ACTIVE,
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
      entityTypeId: 'd2013bnn9cl0u3uqkkz1748c', // LMSH_PUBL
      incorporationDate: new Date('1997-03-10'),
      incorporationCountry: 'Australia',
      incorporationState: 'QLD',
      address: '789 GoldenEye Boulevard',
      city: 'Brisbane',
      state: 'QLD',
      postcode: '4000',
      country: 'Australia',
      status: EntityStatus.ACTIVE,
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
      memberType: MemberType.INDIVIDUAL,
      beneficiallyHeld: true,
      email: 'james.bond@mi6.gov.uk',
      phone: '+61 412 007 007',
      memberNumber: 'M001',
      address: '007 Secret Service Lane',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      country: 'Australia',
      joinDate: new Date('1997-08-25'),
      status: MemberStatus.ACTIVE,
      tfn: '007007007',
      createdBy: 'system',
      contacts: [
        {
          name: 'James Bond',
          email: 'james.bond@mi6.gov.uk',
          phone: '+61 412 007 007',
          role: 'Primary Contact',
          isPrimary: true,
        },
        {
          name: 'Moneypenny',
          email: 'moneypenny@mi6.gov.uk',
          phone: '+61 412 007 008',
          role: 'Secretary',
          isPrimary: false,
        },
      ],
    },
    {
      firstName: 'Alec',
      lastName: 'Trevelyan',
      memberType: MemberType.INDIVIDUAL,
      beneficiallyHeld: false,
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
      status: MemberStatus.ACTIVE,
      tfn: '006006006',
      createdBy: 'system',
      contacts: [
        {
          name: 'Alec Trevelyan',
          email: 'alec.trevelyan@janus.com',
          phone: '+61 423 006 006',
          role: 'Primary Contact',
          isPrimary: true,
        },
      ],
    },
    {
      entityName: 'MI6 Holdings Pty Ltd',
      memberType: MemberType.COMPANY,
      beneficiallyHeld: true,
      email: 'admin@mi6holdings.com.au',
      phone: '+61 2 0070 0070',
      memberNumber: 'M003',
      address: '789 Intelligence Avenue',
      city: 'Canberra',
      state: 'ACT',
      postcode: '2600',
      country: 'Australia',
      joinDate: new Date('1997-08-25'),
      status: MemberStatus.ACTIVE,
      abn: '00700700704',
      createdBy: 'system',
      contacts: [
        {
          name: 'M',
          email: 'm@mi6.gov.uk',
          phone: '+61 2 0070 0071',
          role: 'Director',
          isPrimary: true,
        },
        {
          name: 'Q',
          email: 'q@mi6.gov.uk',
          phone: '+61 2 0070 0072',
          role: 'Technical Director',
          isPrimary: false,
        },
      ],
    },
    {
      firstName: 'Natalya',
      lastName: 'Simonova',
      memberType: MemberType.INDIVIDUAL,
      beneficiallyHeld: true,
      email: 'natalya.simonova@severnaya.com',
      phone: '+61 434 005 005',
      memberNumber: 'M004',
      address: '123 Siberian Street',
      city: 'Brisbane',
      state: 'QLD',
      postcode: '4000',
      country: 'Australia',
      joinDate: new Date('1997-06-15'),
      status: MemberStatus.ACTIVE,
      tfn: '005005005',
      createdBy: 'system',
      contacts: [
        {
          name: 'Natalya Simonova',
          email: 'natalya.simonova@severnaya.com',
          phone: '+61 434 005 005',
          role: 'Primary Contact',
          isPrimary: true,
        },
      ],
    },
    {
      entityName: 'GoldenEye Holdings Pty Ltd',
      memberType: MemberType.COMPANY,
      beneficiallyHeld: false,
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
      status: MemberStatus.ACTIVE,
      createdBy: 'system',
      contacts: [
        {
          name: 'General Ourumov',
          email: 'general.ourumov@goldeneye.com',
          phone: '+61 445 004 005',
          role: 'Director',
          isPrimary: true,
        },
      ],
    },
  ];

  for (const data of memberData) {
    const { contacts, ...memberDataWithoutContacts } = data;

    const member = await prisma.member.upsert({
      where: {
        entityId_memberNumber: {
          entityId,
          memberNumber: data.memberNumber,
        },
      },
      update: {},
      create: {
        ...memberDataWithoutContacts,
        entityId,
        country: 'Australia',
      },
    });

    // Create contacts for the member
    for (const contactData of contacts) {
      // Check if contact already exists
      const existingContact = await prisma.memberContact.findFirst({
        where: {
          memberId: member.id,
          name: contactData.name,
        },
      });

      if (!existingContact) {
        await prisma.memberContact.create({
          data: {
            ...contactData,
            memberId: member.id,
          },
        });
      }
    }
  }

  console.log(`✅ Created ${memberData.length} members with contacts`);
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
      customRights: {
        preemptiveRights: true,
        antiDilutionProtection: false,
        dragAlongRights: true,
      },
      isArchived: false,
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Preference Shares',
      symbol: 'PREF',
      description: 'Preference shares with priority dividend rights',
      votingRights: false,
      dividendRights: true,
      customRights: {
        dividendRate: '8%',
        liquidationPreference: '2x',
        conversionRights: true,
      },
      isArchived: false,
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Employee Options',
      symbol: 'OPT',
      description: 'Employee share options',
      votingRights: false,
      dividendRights: false,
      customRights: {
        exercisePrice: '1.00',
        vestingSchedule: '4 years with 1 year cliff',
        expiryDate: '2028-12-31',
      },
      isArchived: false,
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Founder Shares',
      symbol: 'FND',
      description: 'Founder shares with special rights',
      votingRights: true,
      dividendRights: true,
      customRights: {
        superVotingRights: true,
        founderProtections: true,
        transferRestrictions: true,
      },
      isArchived: false,
      isActive: true,
      createdBy: 'system',
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
      status: TransactionStatus.COMPLETED,
      createdBy: 'system',
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
      createdBy: 'system',
    },
    // Share transfer
    {
      transactionType: 'TRANSFER',
      securityClassId: securityClasses[0].id,
      quantity: 200,
      reasonCode: 'TRF',
      amountPaidPerSecurity: new Decimal('1.50'),
      amountUnpaidPerSecurity: new Decimal('0.00'),
      currency: 'AUD',
      totalAmountPaid: new Decimal('300.00'),
      totalAmountUnpaid: new Decimal('0.00'),
      fromMemberId: members[0].id,
      toMemberId: members[2].id,
      trancheNumber: 'T002',
      trancheSequence: 1,
      transactionDate: new Date('1997-09-01'),
      settlementDate: new Date('1997-09-01'),
      reference: 'MI6-001',
      description: 'Share transfer to MI6 Holdings',
      status: 'Completed',
      createdBy: 'system',
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
      createdBy: 'system',
    },
    // Employee options grant
    {
      transactionType: 'ISSUE',
      securityClassId: securityClasses[2].id, // Employee Options
      quantity: 100,
      reasonCode: 'BON',
      amountPaidPerSecurity: new Decimal('0.00'),
      amountUnpaidPerSecurity: new Decimal('1.00'),
      currency: 'AUD',
      totalAmountPaid: new Decimal('0.00'),
      totalAmountUnpaid: new Decimal('100.00'),
      toMemberId: members[4].id,
      trancheNumber: 'T004',
      trancheSequence: 1,
      transactionDate: new Date('1997-03-10'),
      settlementDate: new Date('1997-03-10'),
      reference: 'GOLD-001',
      description: 'Employee options grant to GoldenEye Holdings',
      status: 'Completed',
      createdBy: 'system',
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

async function createDemoEventLogs(entityId: string) {
  console.log(`📝 Creating demo event logs for entity ${entityId}...`);

  // Get some members and security classes to reference
  const members = await prisma.member.findMany({
    where: { entityId },
    take: 2,
  });

  const securityClasses = await prisma.securityClass.findMany({
    where: { entityId },
    take: 2,
  });

  if (members.length === 0 || securityClasses.length === 0) {
    console.log(
      '⚠️ Skipping event logs - no members or security classes found'
    );
    return;
  }

  const eventLogData = [
    // Member creation events
    {
      userId: 'system',
      action: 'CREATE',
      tableName: 'Member',
      recordId: members[0].id,
      fieldName: null,
      oldValue: null,
      newValue: JSON.stringify({
        firstName: members[0].firstName,
        lastName: members[0].lastName,
        memberType: members[0].memberType,
        beneficiallyHeld: members[0].beneficiallyHeld,
      }),
      metadata: {
        ip: '127.0.0.1',
        userAgent: 'Demo Seeder',
        source: 'seed-script',
      },
      timestamp: new Date('1997-08-25T10:00:00Z'),
    },
    {
      userId: 'system',
      action: 'CREATE',
      tableName: 'Member',
      recordId: members[1].id,
      fieldName: null,
      oldValue: null,
      newValue: JSON.stringify({
        firstName: members[1].firstName,
        lastName: members[1].lastName,
        memberType: members[1].memberType,
        beneficiallyHeld: members[1].beneficiallyHeld,
      }),
      metadata: {
        ip: '127.0.0.1',
        userAgent: 'Demo Seeder',
        source: 'seed-script',
      },
      timestamp: new Date('1997-08-25T10:30:00Z'),
    },
    // Security class creation events
    {
      userId: 'system',
      action: 'CREATE',
      tableName: 'SecurityClass',
      recordId: securityClasses[0].id,
      fieldName: null,
      oldValue: null,
      newValue: JSON.stringify({
        name: securityClasses[0].name,
        symbol: securityClasses[0].symbol,
        votingRights: securityClasses[0].votingRights,
        dividendRights: securityClasses[0].dividendRights,
        isArchived: securityClasses[0].isArchived,
      }),
      metadata: {
        ip: '127.0.0.1',
        userAgent: 'Demo Seeder',
        source: 'seed-script',
      },
      timestamp: new Date('1997-08-25T11:00:00Z'),
    },
    // Member update event
    {
      userId: 'system',
      action: 'UPDATE',
      tableName: 'Member',
      recordId: members[0].id,
      fieldName: 'beneficiallyHeld',
      oldValue: 'false',
      newValue: 'true',
      metadata: {
        ip: '127.0.0.1',
        userAgent: 'Demo Seeder',
        source: 'seed-script',
      },
      timestamp: new Date('1997-08-25T14:00:00Z'),
    },
    // Security class archive event
    {
      userId: 'system',
      action: 'ARCHIVE',
      tableName: 'SecurityClass',
      recordId: securityClasses[1].id,
      fieldName: 'isArchived',
      oldValue: 'false',
      newValue: 'true',
      metadata: {
        ip: '127.0.0.1',
        userAgent: 'Demo Seeder',
        source: 'seed-script',
      },
      timestamp: new Date('1997-08-25T15:00:00Z'),
    },
  ];

  for (const data of eventLogData) {
    await prisma.eventLog.create({
      data: {
        ...data,
        entityId,
      },
    });
  }

  console.log(`✅ Created ${eventLogData.length} event logs`);
}

async function createDemoUser() {
  console.log('👤 Creating demo user...');
  const email = 'admin@example.org';
  const username = 'admin';
  const name = 'Administrator';

  const userRecordId = 'Wll2qFUkDD9976Aiuhw93YArPiqODq4o';
  const accountRecordId = 'TziFBKMIsEVUxL9Lq4RwbZ1651OUkF0L';

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('ℹ️ Demo user already exists');
    return existing;
  }

  const now = new Date();
  const hashedPassword =
    '7c283c7910dac0aec0ca0edbc28ddbd2:01c7e38775e7433fc69c9ba292055194aae99da4d3d7c2860ca7f6a895ece467943752b55a94e1e33d50e465c8a4efb622b6df8cf3103f27ad74289c1c3d9e88'; // 'password'

  // Create user and account in a transaction
  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userRecordId,
        name,
        email,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        username,
        displayUsername: username,
      },
    }),
    prisma.account.create({
      data: {
        id: accountRecordId,
        accountId: email,
        providerId: 'credential',
        userId: userRecordId,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
    }),
  ]);

  console.log('✅ Created demo user: admin@example.org');
  return user;
}

// Run the seed function
seedDemoData().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});

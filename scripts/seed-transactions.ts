import { PrismaClient } from '../lib/generated/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function seedTransactions() {
  console.log('Starting transaction seed...');

  try {
    // Get or create a sample entity
    let entity = await prisma.entity.findFirst();
    if (!entity) {
      entity = await prisma.entity.create({
        data: {
          name: 'ABC Ltd',
          abn: '51824753556',
          acn: '123456780',
          entityType: 'PROPRIETARY',
          incorporationDate: new Date('2020-01-01'),
          address: '123 Business St',
          city: 'Sydney',
          state: 'NSW',
          postcode: '2000',
          status: 'Active',
        },
      });
      console.log('Created sample entity:', entity.name);
    }

    // Get or create a security class
    let securityClass = await prisma.securityClass.findFirst({
      where: { entityId: entity.id },
    });
    if (!securityClass) {
      securityClass = await prisma.securityClass.create({
        data: {
          entityId: entity.id,
          name: 'Ordinary Shares',
          symbol: 'ORD',
          description: 'Ordinary voting shares',
          votingRights: true,
          dividendRights: true,
          isActive: true,
        },
      });
      console.log('Created security class:', securityClass.name);
    }

    // Get or create sample members
    const members = await prisma.member.findMany({
      where: { entityId: entity.id },
      take: 3,
    });

    if (members.length === 0) {
      // Create sample members
      const memberData = [
        {
          firstName: 'John',
          lastName: 'Smith',
          memberType: 'Individual',
          email: 'john.smith@email.com',
          memberNumber: 'M001',
        },
        {
          firstName: 'Jane',
          lastName: 'Doe',
          memberType: 'Individual',
          email: 'jane.doe@email.com',
          memberNumber: 'M002',
        },
        {
          entityName: 'XYZ Investments Pty Ltd',
          memberType: 'Company',
          email: 'admin@xyzinvestments.com',
          memberNumber: 'M003',
        },
      ];

      for (const memberInfo of memberData) {
        await prisma.member.create({
          data: {
            entityId: entity.id,
            ...memberInfo,
          },
        });
      }
      console.log('Created 3 sample members');
    }

    // Get updated member list
    const updatedMembers = await prisma.member.findMany({
      where: { entityId: entity.id },
    });

    if (updatedMembers.length === 0) {
      console.log('No members found, cannot create transactions');
      return;
    }

    // Create sample transactions based on available members
    const transactions = [];

    // Tranche T001 - Initial issuance
    if (updatedMembers[0]) {
      transactions.push({
        transactionType: 'ISSUE' as const,
        reasonCode: 'INITIAL_ISSUE',
        quantity: 10000,
        amountPaidPerSecurity: new Decimal('1.00'),
        amountUnpaidPerSecurity: new Decimal('0.50'),
        fromMemberId: null,
        toMemberId: updatedMembers[0].id,
        trancheNumber: 'T001',
        trancheSequence: 1,
        transactionDate: new Date('2024-01-15'),
        reference: 'T001-001',
        description: 'Initial share issuance to John Smith',
      });
    }

    if (updatedMembers[1]) {
      transactions.push({
        transactionType: 'ISSUE' as const,
        reasonCode: 'INITIAL_ISSUE',
        quantity: 15000,
        amountPaidPerSecurity: new Decimal('1.00'),
        amountUnpaidPerSecurity: new Decimal('0.50'),
        fromMemberId: null,
        toMemberId: updatedMembers[1].id,
        trancheNumber: 'T001',
        trancheSequence: 2,
        transactionDate: new Date('2024-01-15'),
        reference: 'T001-002',
        description: 'Initial share issuance to Jane Doe',
      });
    }

    if (updatedMembers[2]) {
      transactions.push({
        transactionType: 'ISSUE' as const,
        reasonCode: 'INITIAL_ISSUE',
        quantity: 25000,
        amountPaidPerSecurity: new Decimal('1.00'),
        amountUnpaidPerSecurity: new Decimal('0.50'),
        fromMemberId: null,
        toMemberId: updatedMembers[2].id,
        trancheNumber: 'T001',
        trancheSequence: 3,
        transactionDate: new Date('2024-01-15'),
        reference: 'T001-003',
        description: 'Initial share issuance to XYZ Investments',
      });
    }

    // Tranche T002 - Additional issuance
    if (updatedMembers[0]) {
      transactions.push({
        transactionType: 'ISSUE' as const,
        reasonCode: 'ADDITIONAL_ISSUE',
        quantity: 5000,
        amountPaidPerSecurity: new Decimal('1.25'),
        amountUnpaidPerSecurity: new Decimal('0.25'),
        fromMemberId: null,
        toMemberId: updatedMembers[0].id,
        trancheNumber: 'T002',
        trancheSequence: 1,
        transactionDate: new Date('2024-06-01'),
        reference: 'T002-001',
        description: 'Additional share issuance to John Smith',
      });
    }

    // Transfer transaction (only if we have at least 2 members)
    if (updatedMembers[0] && updatedMembers[1]) {
      transactions.push({
        transactionType: 'TRANSFER' as const,
        reasonCode: 'MEMBER_TRANSFER',
        quantity: 2000,
        transferPricePerSecurity: new Decimal('1.50'),
        fromMemberId: updatedMembers[0].id,
        toMemberId: updatedMembers[1].id,
        transactionDate: new Date('2024-08-15'),
        reference: 'TRF-001',
        description: 'Transfer from John Smith to Jane Doe',
      });
    }

    for (const transactionData of transactions) {
      await prisma.transaction.create({
        data: {
          entityId: entity.id,
          securityClassId: securityClass.id,
          ...transactionData,
          // Calculate totals
          totalAmountPaid: transactionData.amountPaidPerSecurity
            ? transactionData.amountPaidPerSecurity.mul(
                transactionData.quantity
              )
            : null,
          totalAmountUnpaid: transactionData.amountUnpaidPerSecurity
            ? transactionData.amountUnpaidPerSecurity.mul(
                transactionData.quantity
              )
            : null,
          totalTransferAmount: transactionData.transferPricePerSecurity
            ? transactionData.transferPricePerSecurity.mul(
                transactionData.quantity
              )
            : null,
        },
      });
    }

    console.log(`Created ${transactions.length} sample transactions`);
    console.log('Transaction seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedTransactions()
  .then(() => {
    console.log('Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });

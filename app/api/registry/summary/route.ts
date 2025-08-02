import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");

    if (!entityId) {
      return NextResponse.json(
        {
          success: false,
          error: "Entity ID is required",
        },
        { status: 400 }
      );
    }

    // Get counts
    const [
      totalMembers,
      totalSecurities,
      totalTransactions,
      activeSecurities,
      archivedSecurities,
    ] = await Promise.all([
      prisma.member.count({
        where: { entityId },
      }),
      prisma.securityClass.count({
        where: { entityId },
      }),
      prisma.transaction.count({
        where: { entityId },
      }),
      prisma.securityClass.count({
        where: {
          entityId,
          isArchived: false,
        },
      }),
      prisma.securityClass.count({
        where: {
          entityId,
          isArchived: true,
        },
      }),
    ]);

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { entityId },
      select: {
        id: true,
        transactionType: true,
        quantity: true,
        postedDate: true,
        status: true,
        reference: true,
        description: true,
        fromMember: {
          select: {
            givenNames: true,
            familyName: true,
            entityName: true,
          },
        },
        toMember: {
          select: {
            givenNames: true,
            familyName: true,
            entityName: true,
          },
        },
        securityClass: {
          select: {
            name: true,
            symbol: true,
          },
        },
      },
      orderBy: { settlementDate: "desc" },
      take: 10,
    });

    // Format recent transactions
    const formattedRecentTransactions = recentTransactions.map((tx) => ({
      id: tx.id,
      transactionType: tx.transactionType,
      quantity: tx.quantity,
      transactionDate: tx.postedDate.toISOString(),
      status: tx.status,
      reference: tx.reference,
      description: tx.description,
      fromMember: tx.fromMember
        ? tx.fromMember.givenNames && tx.fromMember.familyName
          ? `${tx.fromMember.givenNames} ${tx.fromMember.familyName}`
          : tx.fromMember.entityName
        : null,
      toMember: tx.toMember
        ? tx.toMember.givenNames && tx.toMember.familyName
          ? `${tx.toMember.givenNames} ${tx.toMember.familyName}`
          : tx.toMember.entityName
        : null,
      securityClass: tx.securityClass.name,
      securitySymbol: tx.securityClass.symbol,
    }));

    const summary = {
      totalMembers,
      totalSecurities,
      totalTransactions,
      activeSecurities,
      archivedSecurities,
      recentTransactions: formattedRecentTransactions,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
      },
    });
  } catch (error) {
    console.error("Error fetching registry summary:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch registry summary",
      },
      { status: 500 }
    );
  }
}

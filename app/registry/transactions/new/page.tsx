"use client";

import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEntity } from "@/lib/entity-context";
import { TransactionForm } from "../transaction-form";
import type { Entity } from "@/lib/types/interfaces/Entity";

export default function NewTransactionPage() {
  const router = useRouter();
  const { selectedEntity, entities } = useEntity();

  const handleTransactionSaved = () => {
    // Navigate back to the transactions tab in registry
    router.push("/registry?section=transactions");
  };

  const handleCancel = () => {
    // Navigate back to the transactions tab in registry
    router.push("/registry?section=transactions");
  };

  if (!selectedEntity) {
    return (
      <MainLayout>
        <Card>
          <CardHeader>
            <CardTitle>Record New Transaction</CardTitle>
            <CardDescription>
              Please select an entity to record a transaction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Please select an entity to record a transaction.
              </p>
            </div>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const getPageTitle = () => {
    return "Record New Transaction";
  };

  const getPageDescription = () => {
    return "Record a new securities transaction";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Transactions
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-muted-foreground">
            {getPageDescription()} for {selectedEntity.name}
          </p>
        </div>

        {/* Transaction Form */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Fill in the details for the new transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionForm
              selectedEntity={selectedEntity}
              onSaved={handleTransactionSaved}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

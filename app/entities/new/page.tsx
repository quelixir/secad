"use client";

import { useState } from "react";
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
import { EntityForm } from "../entity-form";

interface EntityFormData {
  name: string;
  entityTypeId: string;
  incorporationDate?: string;
  incorporationCountry?: string;
  incorporationState?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export default function NewEntityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEntitySubmit = async (data: EntityFormData) => {
    try {
      setLoading(true);

      const response = await fetch("/api/entities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/entities");
      } else {
        throw new Error(result.error || "Failed to create entity");
      }
    } catch (error) {
      console.error("Error creating entity:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to the entities page
    router.push("/entities");
  };

  const getPageTitle = () => {
    return "Add New Entity";
  };

  const getPageDescription = () => {
    return "Create a new entity in the system";
  };

  return (
    <MainLayout requireEntity={false}>
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
            Back to Entities
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-muted-foreground">{getPageDescription()}</p>
        </div>

        {/* Entity Form */}
        <Card>
          <CardHeader>
            <CardTitle>Entity Details</CardTitle>
            <CardDescription>
              Fill in the details for the new entity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EntityForm onSubmit={handleEntitySubmit} loading={loading} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

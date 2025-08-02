"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
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
import { EntityForm } from "../../entity-form";
import type { Entity, EntityApiResponse } from "@/lib/types/interfaces/Entity";

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

export default function EditEntityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntity = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/entities/${id}`);
        const result = await response.json();

        if (result.success) {
          // Transform API response to Entity interface
          const apiEntity: EntityApiResponse = result.data;
          const transformedEntity: Entity = {
            ...apiEntity,
            incorporationDate: apiEntity.incorporationDate
              ? new Date(apiEntity.incorporationDate)
              : null,
            createdAt: new Date(apiEntity.createdAt),
            updatedAt: new Date(apiEntity.updatedAt),
          };
          setEntity(transformedEntity);
        } else {
          setError(result.error || "Failed to fetch entity");
        }
      } catch (error) {
        console.error("Error fetching entity:", error);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchEntity();
  }, [id]);

  const handleEntitySubmit = async (data: EntityFormData) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/entities/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/entities");
      } else {
        throw new Error(result.error || "Failed to update entity");
      }
    } catch (error) {
      console.error("Error updating entity:", error);
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
    return "Edit Entity";
  };

  const getPageDescription = () => {
    return entity
      ? `Update information for ${entity.name}`
      : "Update entity information";
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
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
          <div className="text-center py-8 text-muted-foreground">
            Loading entity...
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !entity) {
    return (
      <MainLayout>
        <div className="space-y-6">
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
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>
                Unable to load entity for editing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-destructive mb-4">
                  {error || "Entity not found"}
                </p>
                <Button onClick={handleCancel}>Back to Entities</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

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
              Update the details for this entity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EntityForm
              entity={entity}
              onSubmit={handleEntitySubmit}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

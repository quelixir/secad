import { useState, useEffect } from 'react';
import { EntityType } from '../types/interfaces/EntityType';
import { compliancePackRegistration } from './index';

/**
 * Hook to get all entity types from all enabled compliance packs
 */
export function useAllEntityTypes() {
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    function loadEntityTypes() {
      try {
        setLoading(true);
        const packs = compliancePackRegistration.getAllPacks();
        const types = packs.flatMap((pack) => pack.entityTypes);
        setEntityTypes(types);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to load entity types')
        );
      } finally {
        setLoading(false);
      }
    }

    loadEntityTypes();
  }, []);

  return { entityTypes, loading, error };
}

/**
 * Hook to get entity types for a specific country
 */
export function useEntityTypesByCountry(country?: string) {
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    function loadEntityTypes() {
      try {
        setLoading(true);
        const types = compliancePackRegistration.getEntityTypes(country || '');
        setEntityTypes(types);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to load entity types')
        );
      } finally {
        setLoading(false);
      }
    }

    loadEntityTypes();
  }, [country]);

  return { entityTypes, loading, error };
}

/**
 * Hook to find a specific entity type by ID
 */
export function useEntityType(entityTypeId: string) {
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    function loadEntityType() {
      try {
        setLoading(true);
        const packs = compliancePackRegistration.getAllPacks();
        const type = packs
          .flatMap((pack) => pack.entityTypes)
          .find((t) => t.id === entityTypeId) || {
          id: entityTypeId,
          shortCode: 'UNKNOWN',
          name: 'Unknown Entity Type',
          category: 'OTHER',
          description: `Unknown entity type with ID: ${entityTypeId}`,
        };
        setEntityType(type);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to load entity type')
        );
      } finally {
        setLoading(false);
      }
    }

    if (entityTypeId) {
      loadEntityType();
    } else {
      setEntityType(null);
      setLoading(false);
    }
  }, [entityTypeId]);

  return { entityType, loading, error };
}

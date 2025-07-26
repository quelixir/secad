'use client'

import { createContext, useContext, useState, useEffect } from 'react';
import type { Entity } from './types/interfaces/Entity';
import { trpc } from './trpc/client';

interface EntityContextType {
  selectedEntity: Entity | null;
  setSelectedEntity: (entity: Entity | null) => void;
  clearSelectedEntity: () => void;
  entities: Entity[];
  loading: boolean;
  entityLoaded: boolean; // New flag to indicate if we've attempted to load the stored entity
}

const EntityContext = createContext<EntityContextType>({
  selectedEntity: null,
  setSelectedEntity: () => { },
  clearSelectedEntity: () => { },
  entities: [],
  loading: false,
  entityLoaded: false,
});

export function EntityProvider({ children }: { children: React.ReactNode }) {
  const [selectedEntity, setSelectedEntityState] = useState<Entity | null>(null);
  const [entityLoaded, setEntityLoaded] = useState(false);
  const { data: entities = [], isLoading } = trpc.entities.list.useQuery();

  // Load selected entity from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && entities.length > 0 && !entityLoaded) {
      const storedEntityId = localStorage.getItem('selectedEntityId');
      if (storedEntityId) {
        const entity = entities.find(e => e.id === storedEntityId);
        if (entity) {
          setSelectedEntityState(entity);
        }
      }
      setEntityLoaded(true);
    }
  }, [entities, entityLoaded]);

  const setSelectedEntity = (entity: Entity | null) => {
    setSelectedEntityState(entity);
    if (typeof window !== 'undefined') {
      if (entity) {
        localStorage.setItem('selectedEntityId', entity.id);
      } else {
        localStorage.removeItem('selectedEntityId');
      }
    }
  };

  const clearSelectedEntity = () => {
    setSelectedEntityState(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedEntityId');
    }
  };

  return (
    <EntityContext.Provider value={{
      selectedEntity,
      setSelectedEntity,
      clearSelectedEntity,
      entities,
      loading: isLoading,
      entityLoaded
    }}>
      {children}
    </EntityContext.Provider>
  );
}

export function useEntityContext() {
  const context = useContext(EntityContext);
  if (!context) {
    throw new Error('useEntityContext must be used within an EntityProvider');
  }
  return context;
}

// Backward compatibility export
export const useEntity = useEntityContext; 
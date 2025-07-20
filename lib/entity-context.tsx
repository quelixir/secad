'use client'

import { createContext, useContext, useState } from 'react';
import type { Entity } from './types/interfaces/Entity';
import { trpc } from './trpc/client';

interface EntityContextType {
  selectedEntity: Entity | null;
  setSelectedEntity: (entity: Entity | null) => void;
  entities: Entity[];
  loading: boolean;
}

const EntityContext = createContext<EntityContextType>({
  selectedEntity: null,
  setSelectedEntity: () => { },
  entities: [],
  loading: false,
});

export function EntityProvider({ children }: { children: React.ReactNode }) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const { data: entities = [], isLoading } = trpc.entities.list.useQuery();

  return (
    <EntityContext.Provider value={{
      selectedEntity,
      setSelectedEntity,
      entities,
      loading: isLoading
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
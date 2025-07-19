'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useEntities } from '@/lib/hooks/use-trpc'

interface Entity {
  id: string
  name: string
  entityType: string
  abn?: string
  acn?: string
}

interface EntityContextType {
  selectedEntity: Entity | null
  setSelectedEntity: (entity: Entity | null) => void
  entities: Entity[]
  loading: boolean
  refreshEntities: () => Promise<void>
}

const EntityContext = createContext<EntityContextType | undefined>(undefined)

export function EntityProvider({ children }: { children: React.ReactNode }) {
  const [selectedEntity, setSelectedEntityState] = useState<Entity | null>(null)
  const { data: entitiesData, isLoading, refetch } = useEntities()
  const entities = entitiesData?.data || []

  const setSelectedEntity = (entity: Entity | null) => {
    setSelectedEntityState(entity)
    // Persist to localStorage
    if (entity) {
      localStorage.setItem('selectedEntity', JSON.stringify(entity))
    } else {
      localStorage.removeItem('selectedEntity')
    }
  }

  useEffect(() => {
    // If no entity is selected, try to restore from localStorage or select first entity
    if (!selectedEntity && entities.length > 0) {
      const saved = localStorage.getItem('selectedEntity')
      if (saved) {
        try {
          const savedEntity = JSON.parse(saved)
          // Verify the saved entity still exists
          const exists = entities.find((e: Entity) => e.id === savedEntity.id)
          if (exists) {
            setSelectedEntityState(exists)
          } else {
            // Remove invalid saved entity and select first available
            localStorage.removeItem('selectedEntity')
            setSelectedEntity(entities[0])
          }
        } catch {
          localStorage.removeItem('selectedEntity')
          setSelectedEntity(entities[0])
        }
      } else {
        setSelectedEntity(entities[0])
      }
    }
  }, [entities, selectedEntity])

  const refreshEntities = async () => {
    await refetch()
  }

  return (
    <EntityContext.Provider
      value={{
        selectedEntity,
        setSelectedEntity,
        entities,
        loading: isLoading,
        refreshEntities
      }}
    >
      {children}
    </EntityContext.Provider>
  )
}

export function useEntity() {
  const context = useContext(EntityContext)
  if (context === undefined) {
    throw new Error('useEntity must be used within an EntityProvider')
  }
  return context
} 
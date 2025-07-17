'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

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
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)

  const setSelectedEntity = (entity: Entity | null) => {
    setSelectedEntityState(entity)
    // Persist to localStorage
    if (entity) {
      localStorage.setItem('selectedEntity', JSON.stringify(entity))
    } else {
      localStorage.removeItem('selectedEntity')
    }
  }

  const fetchEntities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/entities')
      const result = await response.json()
      
      if (result.success) {
        setEntities(result.data)
        
        // If no entity is selected, try to restore from localStorage or select first entity
        if (!selectedEntity) {
          const saved = localStorage.getItem('selectedEntity')
          if (saved) {
            try {
              const savedEntity = JSON.parse(saved)
              // Verify the saved entity still exists
              const exists = result.data.find((e: Entity) => e.id === savedEntity.id)
              if (exists) {
                setSelectedEntityState(exists)
              } else {
                // Remove invalid saved entity and select first available
                localStorage.removeItem('selectedEntity')
                if (result.data.length > 0) {
                  setSelectedEntity(result.data[0])
                }
              }
            } catch {
              localStorage.removeItem('selectedEntity')
              if (result.data.length > 0) {
                setSelectedEntity(result.data[0])
              }
            }
          } else if (result.data.length > 0) {
            setSelectedEntity(result.data[0])
          }
        }
      }
    } catch (error) {
      console.error('Error fetching entities:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntities()
  }, [])

  const refreshEntities = async () => {
    await fetchEntities()
  }

  return (
    <EntityContext.Provider
      value={{
        selectedEntity,
        setSelectedEntity,
        entities,
        loading,
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
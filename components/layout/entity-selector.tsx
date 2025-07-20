'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc/client';
import { useEntityContext } from '@/lib/entity-context';
import type { Entity } from '@/lib/types/interfaces/Entity';

const EntitySelector = () => {
  const { data: entities } = trpc.entities.list.useQuery();
  const { setSelectedEntity } = useEntityContext();

  const handleEntityChange = (value: string) => {
    const entity = entities?.find((e: Entity) => e.id === value);
    setSelectedEntity(entity || null);
  };

  return (
    <Select onValueChange={handleEntityChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select an entity" />
      </SelectTrigger>
      <SelectContent>
        {entities?.map((entity: Entity) => (
          <SelectItem key={entity.id} value={entity.id}>
            {entity.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default EntitySelector; 
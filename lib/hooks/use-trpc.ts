import { trpc } from '@/lib/trpc/client';

export { trpc };

// Re-export commonly used hooks for convenience
export const useEntities = (input?: { include?: 'details' | 'basic' }) =>
  trpc.entities.getAll.useQuery(input);
export const useEntity = (id: string) => trpc.entities.getById.useQuery({ id });
export const useCreateEntity = () => trpc.entities.create.useMutation();
export const useUpdateEntity = () => trpc.entities.update.useMutation();
export const useDeleteEntity = () => trpc.entities.delete.useMutation();

export const useMembers = (entityId: string) =>
  trpc.members.getByEntityId.useQuery({ entityId });
export const useMember = (id: string) => trpc.members.getById.useQuery({ id });
export const useCreateMember = () => trpc.members.create.useMutation();
export const useUpdateMember = () => trpc.members.update.useMutation();
export const useDeleteMember = () => trpc.members.delete.useMutation();

export const useSecurities = (entityId: string) =>
  trpc.securities.getByEntityId.useQuery({ entityId });
export const useSecurity = (id: string) =>
  trpc.securities.getById.useQuery({ id });
export const useCreateSecurity = () => trpc.securities.create.useMutation();
export const useUpdateSecurity = () => trpc.securities.update.useMutation();
export const useDeleteSecurity = () => trpc.securities.delete.useMutation();

export const useTransactions = (entityId: string) =>
  trpc.transactions.getByEntityId.useQuery({ entityId });
export const useTransaction = (id: string) =>
  trpc.transactions.getById.useQuery({ id });
export const useCreateTransaction = () =>
  trpc.transactions.create.useMutation();
export const useUpdateTransaction = () =>
  trpc.transactions.update.useMutation();
export const useDeleteTransaction = () =>
  trpc.transactions.delete.useMutation();

export const useAssociates = (entityId: string) =>
  trpc.associates.getByEntityId.useQuery({ entityId });
export const useAssociate = (id: string) =>
  trpc.associates.getById.useQuery({ id });
export const useCreateAssociate = () => trpc.associates.create.useMutation();
export const useUpdateAssociate = () => trpc.associates.update.useMutation();
export const useDeleteAssociate = () => trpc.associates.delete.useMutation();

export const useResolutions = (entityId: string) =>
  trpc.resolutions.getByEntityId.useQuery({ entityId });
export const useResolution = (id: string) =>
  trpc.resolutions.getById.useQuery({ id });
export const useCreateResolution = () => trpc.resolutions.create.useMutation();
export const useUpdateResolution = () => trpc.resolutions.update.useMutation();
export const useDeleteResolution = () => trpc.resolutions.delete.useMutation();

export const useRegistrySummary = (entityId: string) =>
  trpc.registry.getSummary.useQuery({ entityId });
export const useRegistrySecurities = (entityId: string) =>
  trpc.registry.getSecurities.useQuery({ entityId });
export const useRegistryMembers = (entityId: string) =>
  trpc.registry.getMembers.useQuery({ entityId });
export const useRegistryTransactions = (
  entityId: string,
  limit?: number,
  offset?: number
) => trpc.registry.getTransactions.useQuery({ entityId, limit, offset });

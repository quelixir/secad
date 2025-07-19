import { createTRPCRouter } from '@/lib/trpc';
import { entitiesRouter } from './entities';
import { membersRouter } from './members';
import { securitiesRouter } from './securities';
import { transactionsRouter } from './transactions';
import { associatesRouter } from './associates';
import { resolutionsRouter } from './resolutions';
import { registryRouter } from './registry';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  entities: entitiesRouter,
  members: membersRouter,
  securities: securitiesRouter,
  transactions: transactionsRouter,
  associates: associatesRouter,
  resolutions: resolutionsRouter,
  registry: registryRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

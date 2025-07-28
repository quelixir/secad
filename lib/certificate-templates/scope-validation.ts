import { prisma } from '@/lib/db';

export type TemplateScope = 'GLOBAL' | 'USER' | 'ENTITY';

export interface ScopeValidationResult {
  isValid: boolean;
  error?: string;
  hasAccess: boolean;
  accessError?: string;
}

export interface TemplateAccessInfo {
  scope: TemplateScope;
  scopeId?: string | null;
  createdBy: string;
}

/**
 * Validates template scope and permissions
 */
export async function validateTemplateScope(
  userId: string,
  scope: TemplateScope,
  scopeId?: string | null
): Promise<ScopeValidationResult> {
  // Validate scope value
  if (!['GLOBAL', 'USER', 'ENTITY'].includes(scope)) {
    return {
      isValid: false,
      error: 'Invalid scope. Must be GLOBAL, USER, or ENTITY',
      hasAccess: false,
    };
  }

  // Validate scope-specific requirements
  if (scope === 'USER') {
    if (scopeId && scopeId !== userId) {
      return {
        isValid: false,
        error: 'User can only create templates for themselves',
        hasAccess: false,
      };
    }
  }

  if (scope === 'ENTITY') {
    if (!scopeId) {
      return {
        isValid: false,
        error: 'Entity ID is required for ENTITY scope',
        hasAccess: false,
      };
    }

    // Check if user has access to the entity
    const userAccess = await prisma.userEntityAccess.findUnique({
      where: {
        userId_entityId: {
          userId,
          entityId: scopeId,
        },
      },
    });

    if (!userAccess) {
      return {
        isValid: true, // Scope is valid, but no access
        hasAccess: false,
        accessError: 'Access denied to entity',
      };
    }
  }

  return {
    isValid: true,
    hasAccess: true,
  };
}

/**
 * Validates access to an existing template
 */
export async function validateTemplateAccess(
  userId: string,
  template: TemplateAccessInfo
): Promise<ScopeValidationResult> {
  const { scope, scopeId, createdBy } = template;

  // GLOBAL templates - only admin can modify (for now, restrict all operations)
  if (scope === 'GLOBAL') {
    return {
      isValid: true,
      hasAccess: false,
      accessError: 'Insufficient permissions to access global template',
    };
  }

  // USER templates - only creator can access
  if (scope === 'USER') {
    if (scopeId !== userId) {
      return {
        isValid: true,
        hasAccess: false,
        accessError: 'Access denied to user template',
      };
    }
  }

  // ENTITY templates - check entity access
  if (scope === 'ENTITY') {
    if (!scopeId) {
      return {
        isValid: false,
        error: 'Entity templates must have a scopeId',
        hasAccess: false,
      };
    }

    const userAccess = await prisma.userEntityAccess.findUnique({
      where: {
        userId_entityId: {
          userId,
          entityId: scopeId,
        },
      },
    });

    if (!userAccess) {
      return {
        isValid: true,
        hasAccess: false,
        accessError: 'Access denied to entity template',
      };
    }
  }

  return {
    isValid: true,
    hasAccess: true,
  };
}

/**
 * Gets available templates for a user based on scope hierarchy
 * Entity > User > Global
 */
export async function getAvailableTemplates(
  userId: string,
  entityId?: string
): Promise<{
  globalTemplates: any[];
  userTemplates: any[];
  entityTemplates: any[];
}> {
  // Always get GLOBAL templates
  const globalTemplates = await prisma.certificateTemplate.findMany({
    where: {
      scope: 'GLOBAL',
      isActive: true,
    },
    orderBy: { name: 'asc' },
  });

  // Get USER templates for current user
  const userTemplates = await prisma.certificateTemplate.findMany({
    where: {
      scope: 'USER',
      scopeId: userId,
      isActive: true,
    },
    orderBy: { name: 'asc' },
  });

  // Get ENTITY templates if entityId provided
  let entityTemplates: any[] = [];
  if (entityId) {
    // Check if user has access to this entity
    const userAccess = await prisma.userEntityAccess.findUnique({
      where: {
        userId_entityId: {
          userId,
          entityId,
        },
      },
    });

    if (userAccess) {
      entityTemplates = await prisma.certificateTemplate.findMany({
        where: {
          scope: 'ENTITY',
          scopeId: entityId,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      });
    }
  } else {
    // Get all entity templates for entities the user has access to
    const userEntities = await prisma.userEntityAccess.findMany({
      where: { userId },
      select: { entityId: true },
    });

    if (userEntities.length > 0) {
      const entityIds = userEntities.map((uea) => uea.entityId);
      entityTemplates = await prisma.certificateTemplate.findMany({
        where: {
          scope: 'ENTITY',
          scopeId: { in: entityIds },
          isActive: true,
        },
        orderBy: { name: 'asc' },
      });
    }
  }

  return {
    globalTemplates,
    userTemplates,
    entityTemplates,
  };
}

/**
 * Selects the best template based on scope hierarchy
 * Entity > User > Global
 */
export function selectBestTemplate(
  entityTemplates: any[],
  userTemplates: any[],
  globalTemplates: any[]
): any | null {
  // Priority: Entity > User > Global
  // Within each scope, prefer default templates, then by name

  // Check for entity templates
  if (entityTemplates.length > 0) {
    const defaultEntity = entityTemplates.find((t) => t.isDefault);
    if (defaultEntity) return defaultEntity;
    return entityTemplates[0]; // Return first entity template
  }

  // Check for user templates
  if (userTemplates.length > 0) {
    const defaultUser = userTemplates.find((t) => t.isDefault);
    if (defaultUser) return defaultUser;
    return userTemplates[0]; // Return first user template
  }

  // Check for global templates
  if (globalTemplates.length > 0) {
    const defaultGlobal = globalTemplates.find((t) => t.isDefault);
    if (defaultGlobal) return defaultGlobal;
    return globalTemplates[0]; // Return first global template
  }

  return null; // No templates available
}

/**
 * Validates default template constraints
 */
export async function validateDefaultTemplateConstraint(
  scope: TemplateScope,
  scopeId?: string | null,
  excludeTemplateId?: string
): Promise<{ isValid: boolean; error?: string }> {
  const whereClause: any = {
    scope,
    scopeId: scopeId || null,
    isDefault: true,
  };

  if (excludeTemplateId) {
    whereClause.id = { not: excludeTemplateId };
  }

  const existingDefault = await prisma.certificateTemplate.findFirst({
    where: whereClause,
  });

  if (existingDefault) {
    return {
      isValid: false,
      error: 'Only one default template allowed per scope',
    };
  }

  return { isValid: true };
}

/**
 * Gets scope hierarchy priority for template selection
 */
export function getScopeHierarchy(): TemplateScope[] {
  return ['ENTITY', 'USER', 'GLOBAL'];
}

/**
 * Validates template HTML for basic template variables
 */
export function validateTemplateHtml(templateHtml: string): {
  isValid: boolean;
  error?: string;
} {
  if (!templateHtml.includes('{{') || !templateHtml.includes('}}')) {
    return {
      isValid: false,
      error: 'Template HTML must contain template variables ({{variable}})',
    };
  }

  // Basic validation - ensure template has some structure
  if (templateHtml.trim().length < 10) {
    return {
      isValid: false,
      error: 'Template HTML is too short',
    };
  }

  return { isValid: true };
}

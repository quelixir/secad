import {
  CertificateTemplate,
  CertificateTemplateInput,
  CertificateTemplateUpdateInput,
  CertificateTemplateResponse,
  CertificateTemplateListResponse,
} from './CertificateTemplate';

describe('CertificateTemplate Interface', () => {
  describe('CertificateTemplate interface', () => {
    it('should allow creation of valid CertificateTemplate object', () => {
      const template: CertificateTemplate = {
        id: 'template-123',
        name: 'Default Certificate Template',
        description:
          'Standard certificate template for securities transactions',
        templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
        templateCss: 'body { font-family: Arial; }',
        scope: 'GLOBAL',
        scopeId: null,
        isDefault: true,
        isActive: true,
        createdBy: 'user-123',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      };

      expect(template.id).toBe('template-123');
      expect(template.name).toBe('Default Certificate Template');
      expect(template.scope).toBe('GLOBAL');
      expect(template.isDefault).toBe(true);
      expect(template.isActive).toBe(true);
    });

    it('should allow optional fields to be undefined', () => {
      const template: CertificateTemplate = {
        id: 'template-123',
        name: 'Default Certificate Template',
        description:
          'Standard certificate template for securities transactions',
        templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
        templateCss: 'body { font-family: Arial; }',
        scope: 'GLOBAL',
        scopeId: null,
        isDefault: true,
        isActive: true,
        createdBy: 'user-123',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      };

      expect(template.description).toBeDefined();
      expect(template.templateCss).toBeDefined();
      expect(template.scopeId).toBeNull();
      expect(template.createdBy).toBeDefined();
    });

    it('should allow null values for optional fields', () => {
      const template: CertificateTemplate = {
        id: 'template-123',
        name: 'Default Certificate Template',
        description: undefined,
        templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
        templateCss: undefined,
        scope: 'GLOBAL',
        scopeId: null,
        isDefault: true,
        isActive: true,
        createdBy: 'user-123',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      };

      expect(template.description).toBeUndefined();
      expect(template.templateCss).toBeUndefined();
      expect(template.scopeId).toBeNull();
      expect(template.createdBy).toBe('user-123'); // createdBy is required, not optional
    });
  });

  describe('CertificateTemplateInput interface', () => {
    it('should allow creation of valid CertificateTemplateInput object', () => {
      const templateInput: CertificateTemplateInput = {
        name: 'Custom Certificate Template',
        description: 'A custom certificate template',
        templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
        templateCss: 'body { font-family: Arial; }',
        scope: 'USER',
        scopeId: 'user-123',
        isDefault: false,
        isActive: true,
      };

      expect(templateInput.name).toBe('Custom Certificate Template');
      expect(templateInput.scope).toBe('USER');
      expect(templateInput.scopeId).toBe('user-123');
      expect(templateInput.isDefault).toBe(false);
    });

    it('should allow optional fields to be undefined', () => {
      const templateInput: CertificateTemplateInput = {
        name: 'Custom Certificate Template',
        templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
        scope: 'GLOBAL',
        isDefault: false,
        isActive: true,
      };

      expect(templateInput.description).toBeUndefined();
      expect(templateInput.templateCss).toBeUndefined();
      expect(templateInput.scopeId).toBeUndefined();
    });

    it('should allow null values for optional fields', () => {
      const templateInput: CertificateTemplateInput = {
        name: 'Custom Certificate Template',
        description: undefined,
        templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
        templateCss: undefined,
        scope: 'GLOBAL',
        scopeId: null,
        isDefault: false,
        isActive: true,
      };

      expect(templateInput.description).toBeUndefined();
      expect(templateInput.templateCss).toBeUndefined();
      expect(templateInput.scopeId).toBeNull();
    });
  });

  describe('CertificateTemplateUpdateInput interface', () => {
    it('should allow creation of valid CertificateTemplateUpdateInput object', () => {
      const templateUpdate: CertificateTemplateUpdateInput = {
        name: 'Updated Certificate Template',
        description: 'An updated certificate template',
        templateHtml:
          '<html><body><h1>{{entityName}}</h1><p>{{memberName}}</p></body></html>',
        templateCss: 'body { font-family: Arial; color: black; }',
        isDefault: true,
        isActive: true,
      };

      expect(templateUpdate.name).toBe('Updated Certificate Template');
      expect(templateUpdate.isDefault).toBe(true);
    });

    it('should allow partial updates with undefined fields', () => {
      const templateUpdate: CertificateTemplateUpdateInput = {
        name: 'Updated Certificate Template',
        isActive: false,
      };

      expect(templateUpdate.name).toBe('Updated Certificate Template');
      expect(templateUpdate.isActive).toBe(false);
      expect(templateUpdate.description).toBeUndefined();
      expect(templateUpdate.templateHtml).toBeUndefined();
      expect(templateUpdate.templateCss).toBeUndefined();
      expect(templateUpdate.isDefault).toBeUndefined();
    });
  });

  describe('CertificateTemplateResponse interface', () => {
    it('should allow creation of valid CertificateTemplateResponse object', () => {
      const templateResponse: CertificateTemplateResponse = {
        success: true,
        data: {
          id: 'template-123',
          name: 'Default Certificate Template',
          description:
            'Standard certificate template for securities transactions',
          templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
          templateCss: 'body { font-family: Arial; }',
          scope: 'GLOBAL',
          scopeId: null,
          isDefault: true,
          isActive: true,
          createdBy: 'user-123',
          createdAt: new Date('2020-01-01'),
          updatedAt: new Date('2020-01-01'),
        },
        message: 'Template retrieved successfully',
      };

      expect(templateResponse.success).toBe(true);
      expect((templateResponse.data as CertificateTemplate).id).toBe(
        'template-123'
      );
      expect(templateResponse.message).toBe('Template retrieved successfully');
    });

    it('should allow error response', () => {
      const templateResponse: CertificateTemplateResponse = {
        success: false,
        data: undefined,
        message: 'Template not found',
        errors: ['Template with ID template-123 not found'],
      };

      expect(templateResponse.success).toBe(false);
      expect(templateResponse.data).toBeUndefined();
      expect(templateResponse.message).toBe('Template not found');
      expect(templateResponse.errors).toContain(
        'Template with ID template-123 not found'
      );
    });
  });

  describe('CertificateTemplateListResponse interface', () => {
    it('should allow creation of valid CertificateTemplateListResponse object', () => {
      const templateListResponse: CertificateTemplateListResponse = {
        success: true,
        data: [
          {
            id: 'template-1',
            name: 'Global Default Template',
            description: 'Default global template',
            templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
            templateCss: 'body { font-family: Arial; }',
            scope: 'GLOBAL',
            scopeId: null,
            isDefault: true,
            isActive: true,
            createdBy: 'user-123',
            createdAt: new Date('2020-01-01'),
            updatedAt: new Date('2020-01-01'),
          },
          {
            id: 'template-2',
            name: 'User Custom Template',
            description: 'Custom user template',
            templateHtml:
              '<html><body><h1>{{entityName}}</h1><p>{{memberName}}</p></body></html>',
            templateCss: 'body { font-family: Arial; color: black; }',
            scope: 'USER',
            scopeId: 'user-123',
            isDefault: false,
            isActive: true,
            createdBy: 'user-123',
            createdAt: new Date('2020-02-01'),
            updatedAt: new Date('2020-02-01'),
          },
        ],
        message: 'Templates retrieved successfully',
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      expect(templateListResponse.success).toBe(true);
      expect(templateListResponse.data).toHaveLength(2);
      expect(templateListResponse.data?.[0].name).toBe(
        'Global Default Template'
      );
      expect(templateListResponse.data?.[1].name).toBe('User Custom Template');
      expect(templateListResponse.pagination?.total).toBe(2);
    });

    it('should allow empty list response', () => {
      const templateListResponse: CertificateTemplateListResponse = {
        success: true,
        data: [],
        message: 'No templates found',
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      expect(templateListResponse.success).toBe(true);
      expect(templateListResponse.data).toHaveLength(0);
      expect(templateListResponse.message).toBe('No templates found');
      expect(templateListResponse.pagination?.total).toBe(0);
    });
  });

  describe('Scope validation', () => {
    it('should validate GLOBAL scope with null scopeId', () => {
      const template: CertificateTemplate = {
        id: 'template-123',
        name: 'Global Template',
        templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
        scope: 'GLOBAL',
        scopeId: null,
        isDefault: true,
        isActive: true,
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      };

      expect(template.scope).toBe('GLOBAL');
      expect(template.scopeId).toBeNull();
    });

    it('should validate USER scope with user scopeId', () => {
      const template: CertificateTemplate = {
        id: 'template-123',
        name: 'User Template',
        templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
        scope: 'USER',
        scopeId: 'user-123',
        isDefault: false,
        isActive: true,
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      };

      expect(template.scope).toBe('USER');
      expect(template.scopeId).toBe('user-123');
    });

    it('should validate ENTITY scope with entity scopeId', () => {
      const template: CertificateTemplate = {
        id: 'template-123',
        name: 'Entity Template',
        templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
        scope: 'ENTITY',
        scopeId: 'entity-123',
        isDefault: false,
        isActive: true,
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      };

      expect(template.scope).toBe('ENTITY');
      expect(template.scopeId).toBe('entity-123');
    });
  });

  describe('Template content validation', () => {
    it('should validate HTML content with template variables', () => {
      const template: CertificateTemplate = {
        id: 'template-123',
        name: 'Variable Template',
        templateHtml: `
          <html>
            <body>
              <h1>{{entityName}}</h1>
              <p>Member: {{memberName}}</p>
              <p>Transaction: {{transactionId}}</p>
              <p>Amount: {{transactionAmount}}</p>
            </body>
          </html>
        `,
        templateCss: `
          body { font-family: Arial; }
          h1 { color: #333; }
          p { margin: 10px 0; }
        `,
        scope: 'GLOBAL',
        scopeId: null,
        isDefault: true,
        isActive: true,
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      };

      expect(template.templateHtml).toContain('{{entityName}}');
      expect(template.templateHtml).toContain('{{memberName}}');
      expect(template.templateHtml).toContain('{{transactionId}}');
      expect(template.templateHtml).toContain('{{transactionAmount}}');
      expect(template.templateCss).toContain('font-family: Arial');
    });

    it('should validate minimal template content', () => {
      const template: CertificateTemplate = {
        id: 'template-123',
        name: 'Minimal Template',
        templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
        scope: 'GLOBAL',
        scopeId: null,
        isDefault: true,
        isActive: true,
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      };

      expect(template.templateHtml).toContain('{{entityName}}');
      expect(template.templateCss).toBeUndefined();
    });
  });

  describe('Type validation', () => {
    it('should validate CertificateTemplate object structure', () => {
      const template: CertificateTemplate = {
        id: 'template-123',
        name: 'Test Template',
        templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
        scope: 'GLOBAL',
        scopeId: null,
        isDefault: true,
        isActive: true,
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      };

      expect(typeof template.id).toBe('string');
      expect(typeof template.name).toBe('string');
      expect(typeof template.templateHtml).toBe('string');
      expect(typeof template.scope).toBe('string');
      expect(typeof template.isDefault).toBe('boolean');
      expect(typeof template.isActive).toBe('boolean');
      expect(template.createdAt instanceof Date).toBe(true);
      expect(template.updatedAt instanceof Date).toBe(true);
    });

    it('should validate CertificateTemplateInput object structure', () => {
      const templateInput: CertificateTemplateInput = {
        name: 'Test Template',
        templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
        scope: 'GLOBAL',
        isDefault: true,
        isActive: true,
      };

      expect(typeof templateInput.name).toBe('string');
      expect(typeof templateInput.templateHtml).toBe('string');
      expect(typeof templateInput.scope).toBe('string');
      expect(typeof templateInput.isDefault).toBe('boolean');
      expect(typeof templateInput.isActive).toBe('boolean');
    });

    it('should validate CertificateTemplateResponse object structure', () => {
      const templateResponse: CertificateTemplateResponse = {
        success: true,
        data: {
          id: 'template-123',
          name: 'Test Template',
          templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
          scope: 'GLOBAL',
          scopeId: null,
          isDefault: true,
          isActive: true,
          createdAt: new Date('2020-01-01'),
          updatedAt: new Date('2020-01-01'),
        },
        message: 'Success',
      };

      expect(typeof templateResponse.success).toBe('boolean');
      expect(typeof templateResponse.message).toBe('string');
      expect(templateResponse.data).toBeDefined();
    });
  });

  describe('Interface compatibility', () => {
    it('should allow CertificateTemplateInput to be used for template creation', () => {
      const templateInput: CertificateTemplateInput = {
        name: 'New Template',
        templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
        scope: 'GLOBAL',
        isDefault: false,
        isActive: true,
      };

      // Simulate template creation
      const createdTemplate: CertificateTemplate = {
        id: 'template-123',
        name: templateInput.name,
        templateHtml: templateInput.templateHtml,
        scope: templateInput.scope,
        scopeId: null,
        isDefault: templateInput.isDefault ?? false,
        isActive: templateInput.isActive ?? true,
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      };

      expect(createdTemplate.name).toBe(templateInput.name);
      expect(createdTemplate.templateHtml).toBe(templateInput.templateHtml);
      expect(createdTemplate.scope).toBe(templateInput.scope);
      expect(createdTemplate.isDefault).toBe(templateInput.isDefault);
      expect(createdTemplate.isActive).toBe(templateInput.isActive);
    });

    it('should allow CertificateTemplateUpdateInput to be used for template updates', () => {
      const templateUpdate: CertificateTemplateUpdateInput = {
        name: 'Updated Template',
        isActive: false,
      };

      // Simulate template update
      const updatedTemplate: CertificateTemplate = {
        id: 'template-123',
        name: templateUpdate.name || 'Original Name',
        templateHtml: '<html><body><h1>{{entityName}}</h1></body></html>',
        scope: 'GLOBAL',
        scopeId: null,
        isDefault: true,
        isActive: templateUpdate.isActive ?? true, // Use nullish coalescing
        createdBy: 'user-123',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01'),
      };

      expect(updatedTemplate.name).toBe(templateUpdate.name);
      expect(updatedTemplate.isActive).toBe(templateUpdate.isActive);
    });
  });
});

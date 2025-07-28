import { prisma } from '../lib/db';
import { DEFAULT_CERTIFICATE_TEMPLATE } from '../lib/certificate-templates/default-template';

async function seedDefaultCertificateTemplate() {
  try {
    console.log('🌱 Seeding default certificate template...');

    // Check if default template already exists
    const existingDefault = await prisma.certificateTemplate.findFirst({
      where: {
        scope: 'GLOBAL',
        scopeId: null,
        isDefault: true,
      },
    });

    if (existingDefault) {
      console.log(
        '✅ Default certificate template already exists, skipping...'
      );
      return;
    }

    // Create the default template
    const defaultTemplate = await prisma.certificateTemplate.create({
      data: {
        name: DEFAULT_CERTIFICATE_TEMPLATE.name,
        description: DEFAULT_CERTIFICATE_TEMPLATE.description,
        templateHtml: DEFAULT_CERTIFICATE_TEMPLATE.templateHtml,
        templateCss: DEFAULT_CERTIFICATE_TEMPLATE.templateCss,
        scope: DEFAULT_CERTIFICATE_TEMPLATE.scope,
        scopeId: DEFAULT_CERTIFICATE_TEMPLATE.scopeId,
        isDefault: DEFAULT_CERTIFICATE_TEMPLATE.isDefault,
        isActive: DEFAULT_CERTIFICATE_TEMPLATE.isActive,
        createdBy: 'system', // System-generated template
      },
    });

    console.log('✅ Default certificate template created successfully!');
    console.log(`📄 Template ID: ${defaultTemplate.id}`);
    console.log(`📄 Template Name: ${defaultTemplate.name}`);
    console.log(`📄 Template Scope: ${defaultTemplate.scope}`);
    console.log(`📄 Is Default: ${defaultTemplate.isDefault}`);

    // Log template statistics
    const templateStats = {
      htmlLength: defaultTemplate.templateHtml.length,
      cssLength: defaultTemplate.templateCss?.length || 0,
      totalLength:
        defaultTemplate.templateHtml.length +
        (defaultTemplate.templateCss?.length || 0),
    };

    console.log('📊 Template Statistics:');
    console.log(`   - HTML Length: ${templateStats.htmlLength} characters`);
    console.log(`   - CSS Length: ${templateStats.cssLength} characters`);
    console.log(`   - Total Length: ${templateStats.totalLength} characters`);

    // Count template variables
    const templateVariables = [
      'certificateNumber',
      'generationDate',
      'generationTimestamp',
      'entityName',
      'entityType',
      'entityAddress',
      'entityContact',
      'entityPhone',
      'entityEmail',
      'memberName',
      'memberType',
      'memberAddress',
      'memberContact',
      'transactionId',
      'transactionDate',
      'transactionType',
      'transactionReason',
      'securityName',
      'securitySymbol',
      'securityClass',
      'quantity',
      'unitPrice',
      'totalValue',
      'transactionAmount',
      'currency',
      'fees',
      'netAmount',
    ];

    console.log(`📋 Template Variables (${templateVariables.length}):`);
    templateVariables.forEach((variable, index) => {
      console.log(`   ${index + 1}. {{${variable}}}`);
    });
  } catch (error) {
    console.error('❌ Error seeding default certificate template:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function if this script is executed directly
if (require.main === module) {
  seedDefaultCertificateTemplate()
    .then(() => {
      console.log('🎉 Default certificate template seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDefaultCertificateTemplate };

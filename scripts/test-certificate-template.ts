import {
  DEFAULT_CERTIFICATE_TEMPLATE,
  SAMPLE_CERTIFICATE_DATA,
} from '../lib/certificate-templates/default-template';
import fs from 'fs';
import path from 'path';

function replaceTemplateVariables(
  templateHtml: string,
  data: Record<string, string>
): string {
  let processedHtml = templateHtml;

  // Replace all template variables with actual data
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    processedHtml = processedHtml.replace(new RegExp(placeholder, 'g'), value);
  });

  return processedHtml;
}

function validateTemplateVariables(
  templateHtml: string,
  data: Record<string, string>
): {
  missingVariables: string[];
  unusedVariables: string[];
  allVariablesPresent: boolean;
} {
  const templateVariables = new Set<string>();
  const dataVariables = new Set(Object.keys(data));

  // Extract all template variables from HTML
  const variableRegex = /\{\{(\w+)\}\}/g;
  let match;
  while ((match = variableRegex.exec(templateHtml)) !== null) {
    templateVariables.add(match[1]);
  }

  // Find missing and unused variables
  const missingVariables = Array.from(templateVariables).filter(
    (variable) => !dataVariables.has(variable)
  );

  const unusedVariables = Array.from(dataVariables).filter(
    (variable) => !templateVariables.has(variable)
  );

  return {
    missingVariables,
    unusedVariables,
    allVariablesPresent: missingVariables.length === 0,
  };
}

function testCertificateTemplate() {
  console.log('🧪 Testing certificate template...');

  // Test 1: Validate template structure
  console.log('\n📋 Test 1: Template Structure Validation');
  console.log(`   - Template Name: ${DEFAULT_CERTIFICATE_TEMPLATE.name}`);
  console.log(
    `   - Template Description: ${DEFAULT_CERTIFICATE_TEMPLATE.description}`
  );
  console.log(`   - Template Scope: ${DEFAULT_CERTIFICATE_TEMPLATE.scope}`);
  console.log(`   - Is Default: ${DEFAULT_CERTIFICATE_TEMPLATE.isDefault}`);
  console.log(`   - Is Active: ${DEFAULT_CERTIFICATE_TEMPLATE.isActive}`);

  // Test 2: Validate A4 sizing and margins
  console.log('\n📏 Test 2: A4 Sizing and Margins');
  const html = DEFAULT_CERTIFICATE_TEMPLATE.templateHtml;
  const hasA4Size = html.includes('size: A4');
  const has20mmMargin = html.includes('margin: 20mm');
  const hasArialFont = html.includes('font-family: Arial');

  console.log(`   - A4 Size: ${hasA4Size ? '✅' : '❌'}`);
  console.log(`   - 20mm Margins: ${has20mmMargin ? '✅' : '❌'}`);
  console.log(`   - Arial Font: ${hasArialFont ? '✅' : '❌'}`);

  // Test 3: Validate template variables
  console.log('\n🔍 Test 3: Template Variables Validation');
  const variableValidation = validateTemplateVariables(
    html,
    SAMPLE_CERTIFICATE_DATA
  );

  console.log(
    `   - All Variables Present: ${
      variableValidation.allVariablesPresent ? '✅' : '❌'
    }`
  );

  if (variableValidation.missingVariables.length > 0) {
    console.log(
      `   - Missing Variables: ${variableValidation.missingVariables.join(
        ', '
      )}`
    );
  }

  if (variableValidation.unusedVariables.length > 0) {
    console.log(
      `   - Unused Variables: ${variableValidation.unusedVariables.join(', ')}`
    );
  }

  // Test 4: Test template rendering
  console.log('\n🎨 Test 4: Template Rendering');
  try {
    const renderedHtml = replaceTemplateVariables(
      html,
      SAMPLE_CERTIFICATE_DATA
    );

    // Check if all placeholders were replaced
    const remainingPlaceholders = (renderedHtml.match(/\{\{\w+\}\}/g) || [])
      .length;
    console.log(
      `   - Remaining Placeholders: ${remainingPlaceholders} (should be 0)`
    );

    if (remainingPlaceholders === 0) {
      console.log('   ✅ All template variables replaced successfully');
    } else {
      console.log('   ❌ Some template variables not replaced');
    }

    // Test 5: Generate test output file
    console.log('\n📄 Test 5: Generate Test Output');
    const outputDir = path.join(process.cwd(), 'test-output');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const testOutputPath = path.join(outputDir, 'certificate-test.html');
    fs.writeFileSync(testOutputPath, renderedHtml);

    console.log(`   ✅ Test output saved to: ${testOutputPath}`);
    console.log(
      `   📊 File size: ${(renderedHtml.length / 1024).toFixed(2)} KB`
    );

    // Test 6: Validate CSS
    console.log('\n🎨 Test 6: CSS Validation');
    const css = DEFAULT_CERTIFICATE_TEMPLATE.templateCss || '';
    const hasPrintStyles = css.includes('@media print');
    const hasResponsiveStyles = css.includes('@media screen');
    const hasAccessibilityStyles = css.includes(
      '@media (prefers-reduced-motion'
    );

    console.log(`   - Print Styles: ${hasPrintStyles ? '✅' : '❌'}`);
    console.log(`   - Responsive Styles: ${hasResponsiveStyles ? '✅' : '❌'}`);
    console.log(
      `   - Accessibility Styles: ${hasAccessibilityStyles ? '✅' : '❌'}`
    );

    // Test 7: Professional styling validation
    console.log('\n💼 Test 7: Professional Styling Validation');
    const hasProfessionalColors =
      html.includes('#2c3e50') && html.includes('#7f8c8d');
    const hasGridLayout = html.includes('display: grid');
    const hasSignatureSection = html.includes('signature-section');
    const hasWatermark = html.includes('watermark');
    const hasDisclaimer = html.includes('disclaimer');

    console.log(
      `   - Professional Colors: ${hasProfessionalColors ? '✅' : '❌'}`
    );
    console.log(`   - Grid Layout: ${hasGridLayout ? '✅' : '❌'}`);
    console.log(`   - Signature Section: ${hasSignatureSection ? '✅' : '❌'}`);
    console.log(`   - Watermark: ${hasWatermark ? '✅' : '❌'}`);
    console.log(`   - Disclaimer: ${hasDisclaimer ? '✅' : '❌'}`);

    // Test 8: Required sections validation
    console.log('\n📋 Test 8: Required Sections Validation');
    const requiredSections = [
      'Entity Information',
      'Member Information',
      'Transaction Information',
      'Securities Information',
      'Financial Information',
    ];

    const missingSections = requiredSections.filter(
      (section) => !html.includes(section)
    );

    if (missingSections.length === 0) {
      console.log('   ✅ All required sections present');
    } else {
      console.log(`   ❌ Missing sections: ${missingSections.join(', ')}`);
    }

    // Summary
    console.log('\n📊 Test Summary:');
    const allTestsPassed =
      hasA4Size &&
      has20mmMargin &&
      hasArialFont &&
      variableValidation.allVariablesPresent &&
      remainingPlaceholders === 0 &&
      hasProfessionalColors &&
      hasGridLayout &&
      missingSections.length === 0;

    console.log(
      `   ${allTestsPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed'}`
    );

    return allTestsPassed;
  } catch (error) {
    console.error('❌ Error during template testing:', error);
    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  const success = testCertificateTemplate();
  process.exit(success ? 0 : 1);
}

export { testCertificateTemplate };

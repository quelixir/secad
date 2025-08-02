import {
  TemplateValidationService,
  TemplateData,
} from "../lib/certificate-templates/template-validation";

function testTemplateValidation() {
  console.log("🧪 Testing Template Validation System...");

  const validationService = new TemplateValidationService();

  // Test 1: Valid template data
  console.log("\n📋 Test 1: Valid Template Data");
  const validData: TemplateData = {
    entityName: "Acme Corporation Ltd",
    memberName: "Jane Doe",
    transactionId: "TXN-2025-001234",
    transactionDate: "2025-01-15",
    securityName: "Acme Corporation Ordinary Shares",
    quantity: "1000",
    transactionAmount: "AUD 25000.00",
    currency: "AUD",
  };

  const validResult = validationService.validateTemplateData(validData);
  console.log(
    `   ✅ Valid data test: ${validResult.isValid ? "PASSED" : "FAILED"}`,
  );
  console.log(`   📊 Completeness score: ${validResult.completenessScore}%`);
  console.log(`   ⚠️  Warnings: ${validResult.warnings.length}`);
  console.log(
    `   🔧 Fallback values: ${Object.keys(validResult.fallbackValues).length}`,
  );

  // Test 2: Invalid template data
  console.log("\n❌ Test 2: Invalid Template Data");
  const invalidData: TemplateData = {
    entityName: "A", // Too short
    memberName: "Jane Doe",
    transactionId: "invalid-id", // Invalid format
    transactionDate: "15/01/2025", // Invalid format
    securityName: "Acme Corporation Ordinary Shares",
    quantity: "1000",
    transactionAmount: "25000.00", // Missing currency
    currency: "AUD",
  };

  const invalidResult = validationService.validateTemplateData(invalidData);
  console.log(
    `   ❌ Invalid data test: ${!invalidResult.isValid ? "PASSED" : "FAILED"}`,
  );
  console.log(`   🚨 Errors: ${invalidResult.errors.length}`);
  console.log(`   📊 Completeness score: ${invalidResult.completenessScore}%`);
  console.log(
    `   🔍 Invalid formats: ${invalidResult.invalidFormats.join(", ")}`,
  );

  // Test 3: Missing required fields
  console.log("\n🔍 Test 3: Missing Required Fields");
  const partialData: TemplateData = {
    entityName: "Acme Corporation Ltd",
    // Missing other required fields
  };

  const partialResult = validationService.validateTemplateData(partialData);
  console.log(
    `   🔍 Missing fields test: ${!partialResult.isValid ? "PASSED" : "FAILED"}`,
  );
  console.log(
    `   🚨 Missing variables: ${partialResult.missingVariables.join(", ")}`,
  );
  console.log(`   📊 Completeness score: ${partialResult.completenessScore}%`);

  // Test 4: Template HTML validation
  console.log("\n🎨 Test 4: Template HTML Validation");
  const validTemplate = {
    id: "test-template",
    name: "Test Template",
    description: "Test template",
    templateHtml: `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>{{entityName}}</h1>
          <p>{{memberName}}</p>
          <p>{{transactionId}}</p>
          <p>{{transactionDate}}</p>
          <p>{{securityName}}</p>
          <p>{{quantity}}</p>
          <p>{{transactionAmount}}</p>
          <p>{{currency}}</p>
        </body>
      </html>
    `,
    templateCss: `
      @page { size: A4; margin: 20mm; }
      @media print { body { color: black; } }
    `,
    scope: "GLOBAL",
    scopeId: null,
    isDefault: false,
    isActive: true,
    createdBy: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const templateResult = validationService.validateTemplate(validTemplate);
  console.log(
    `   ✅ Template validation: ${templateResult.isValid ? "PASSED" : "FAILED"}`,
  );
  console.log(
    `   📊 Template completeness: ${templateResult.completenessScore}%`,
  );
  console.log(`   ⚠️  Template warnings: ${templateResult.warnings.length}`);

  // Test 5: Invalid template HTML
  console.log("\n❌ Test 5: Invalid Template HTML");
  const invalidTemplate = {
    id: "test-template",
    name: "Test Template",
    description: "Test template",
    templateHtml: `
      <body>
        <h1>{{entityName}}</h1>
        <p>{{invalidVariable}}</p>
      </body>
    `, // Missing DOCTYPE, HTML tags, and required variables
    templateCss: "",
    scope: "GLOBAL",
    scopeId: null,
    isDefault: false,
    isActive: true,
    createdBy: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const invalidTemplateResult =
    validationService.validateTemplate(invalidTemplate);
  console.log(
    `   ❌ Invalid template test: ${
      !invalidTemplateResult.isValid ? "PASSED" : "FAILED"
    }`,
  );
  console.log(`   🚨 Template errors: ${invalidTemplateResult.errors.length}`);
  console.log(
    `   ⚠️  Template warnings: ${invalidTemplateResult.warnings.length}`,
  );

  // Test 6: Performance test
  console.log("\n⚡ Test 6: Performance Test");
  const largeData: TemplateData = {
    entityName: "A".repeat(200), // Max length
    memberName: "B".repeat(200),
    transactionId: "TXN-2025-001234",
    transactionDate: "2025-01-15",
    securityName: "C".repeat(200),
    quantity: "1000",
    transactionAmount: "AUD 25000.00",
    currency: "AUD",
  };

  const startTime = Date.now();
  const performanceResult = validationService.validateTemplateData(largeData);
  const endTime = Date.now();

  console.log(`   ⚡ Performance test: ${endTime - startTime}ms`);
  console.log(
    `   ✅ Performance acceptable: ${endTime - startTime < 100 ? "YES" : "NO"}`,
  );

  // Test 7: Validation rules
  console.log("\n📋 Test 7: Validation Rules");
  const allRules = validationService.getAllValidationRules();
  console.log(`   📋 Total validation rules: ${allRules.length}`);
  console.log(
    `   🔍 Required fields: ${allRules.filter((r) => r.required).length}`,
  );
  console.log(
    `   🔧 Optional fields: ${allRules.filter((r) => !r.required).length}`,
  );

  // Test 8: Error formatting
  console.log("\n📝 Test 8: Error Formatting");
  const errorMessages = validationService.formatValidationErrors(invalidResult);
  const warningMessages =
    validationService.formatValidationWarnings(partialResult);

  console.log(`   📝 Error messages: ${errorMessages.length}`);
  console.log(`   ⚠️  Warning messages: ${warningMessages.length}`);

  // Summary
  console.log("\n📊 Validation System Summary:");
  const allTests = [
    { name: "Valid Data", passed: validResult.isValid },
    { name: "Invalid Data", passed: !invalidResult.isValid },
    { name: "Missing Fields", passed: !partialResult.isValid },
    { name: "Template HTML", passed: templateResult.isValid },
    { name: "Invalid Template", passed: !invalidTemplateResult.isValid },
    { name: "Performance", passed: endTime - startTime < 100 },
    { name: "Validation Rules", passed: allRules.length > 0 },
    { name: "Error Formatting", passed: errorMessages.length > 0 },
  ];

  const passedTests = allTests.filter((test) => test.passed).length;
  const totalTests = allTests.length;

  console.log(`   ✅ Tests passed: ${passedTests}/${totalTests}`);
  console.log(
    `   📊 Success rate: ${Math.round((passedTests / totalTests) * 100)}%`,
  );

  return passedTests === totalTests;
}

// Run the test if this script is executed directly
if (require.main === module) {
  const success = testTemplateValidation();
  console.log(`\n🎉 ${success ? "All tests passed!" : "Some tests failed."}`);
  process.exit(success ? 0 : 1);
}

export { testTemplateValidation };

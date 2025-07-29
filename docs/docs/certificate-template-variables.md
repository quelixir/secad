---
sidebar_position: 2
title: Certificate Template Variables
description: Complete reference for all available template variables in certificate templates
---

# Certificate Template Variables

This document describes all available template variables that can be used in certificate templates for generating PDF certificates.

## Overview

Certificate templates use a simple variable replacement system where variables are enclosed in double curly braces: `{{variableName}}`. All variables are automatically populated from transaction data when a certificate is generated.

## Variable Categories

### Entity Information

Variables related to the entity that owns the securities.

| Variable            | Description                      | Example                                         |
| ------------------- | -------------------------------- | ----------------------------------------------- |
| `{{entityName}}`    | Full name of the entity          | "Acme Corporation Ltd"                          |
| `{{entityId}}`      | Unique identifier for the entity | "entity123"                                     |
| `{{entityAddress}}` | Complete formatted address       | "123 Business St, Sydney, NSW, 2000, Australia" |
| `{{entityPhone}}`   | Entity phone number              | "+61 2 1234 5678"                               |
| `{{entityType}}`    | Type of entity                   | "Company"                                       |
| `{{entityContact}}` | Primary contact name             | "Acme Corporation Ltd"                          |
| `{{entityEmail}}`   | Entity email address             | "contact@acme.com"                              |

### Transaction Information

Variables related to the specific transaction that triggered the certificate generation.

| Variable                     | Description                     | Example                  |
| ---------------------------- | ------------------------------- | ------------------------ |
| `{{transactionId}}`          | Unique transaction identifier   | "txn123"                 |
| `{{transactionDate}}`        | Date of the transaction         | "15/01/2024"             |
| `{{transactionType}}`        | Type of transaction             | "Issuance"               |
| `{{transactionReason}}`      | Reason code for the transaction | "Initial"                |
| `{{transactionDescription}}` | Human-readable description      | "Initial share issuance" |

### Security Information

Variables related to the security class being traded.

| Variable             | Description                     | Example           |
| -------------------- | ------------------------------- | ----------------- |
| `{{securityClass}}`  | Name of the security class      | "Ordinary Shares" |
| `{{securityName}}`   | Full name of the security       | "Ordinary Shares" |
| `{{securitySymbol}}` | Trading symbol for the security | "ORD"             |

### Financial Information

Variables related to quantities and monetary amounts.

| Variable          | Description                         | Example      |
| ----------------- | ----------------------------------- | ------------ |
| `{{quantity}}`    | Number of securities                | "1,000"      |
| `{{totalAmount}}` | Total amount paid/unpaid            | "$50,000.00" |
| `{{unitPrice}}`   | Price per security                  | "$50.00"     |
| `{{totalValue}}`  | Total value (unit price × quantity) | "$50,000.00" |
| `{{currency}}`    | Currency code                       | "AUD"        |

### Member Information

Variables related to the member receiving the securities.

| Variable            | Description                | Example                                          |
| ------------------- | -------------------------- | ------------------------------------------------ |
| `{{memberName}}`    | Full name of the member    | "John Doe"                                       |
| `{{memberId}}`      | Unique member identifier   | "member123"                                      |
| `{{memberType}}`    | Type of member             | "Individual"                                     |
| `{{memberAddress}}` | Complete formatted address | "456 Member St, Melbourne, VIC, 3000, Australia" |

### Certificate Information

Variables specific to the certificate itself.

| Variable                | Description                     | Example          |
| ----------------------- | ------------------------------- | ---------------- |
| `{{certificateNumber}}` | Unique certificate number       | "CERT2024000001" |
| `{{issueDate}}`         | Date the certificate was issued | "15/01/2024"     |

### System Information

Variables that provide current system information.

| Variable          | Description                                | Example      |
| ----------------- | ------------------------------------------ | ------------ |
| `{{currentDate}}` | Current date when certificate is generated | "15/01/2024" |
| `{{currentYear}}` | Current year                               | "2024"       |

## Usage Examples

### Basic Certificate Template

```html
<html>
<head>
    <title>Certificate of {{securityClass}}</title>
</head>
<body>
    <h1>Certificate of {{securityClass}}</h1>
    
    <div class="certificate-info">
        <p><strong>Certificate Number:</strong> {{certificateNumber}}</p>
        <p><strong>Issue Date:</strong> {{issueDate}}</p>
        <p><strong>Entity:</strong> {{entityName}}</p>
        <p><strong>Member:</strong> {{memberName}}</p>
    </div>
    
    <div class="security-details">
        <p><strong>Security Class:</strong> {{securityClass}}</p>
        <p><strong>Quantity:</strong> {{quantity}}</p>
        <p><strong>Unit Price:</strong> {{unitPrice}}</p>
        <p><strong>Total Value:</strong> {{totalValue}}</p>
    </div>
    
    <div class="transaction-details">
        <p><strong>Transaction ID:</strong> {{transactionId}}</p>
        <p><strong>Transaction Date:</strong> {{transactionDate}}</p>
        <p><strong>Transaction Type:</strong> {{transactionType}}</p>
    </div>
</body>
</html>
```

### Detailed Certificate Template

```html
<html>
<head>
    <title>{{entityName}} - {{securityClass}} Certificate</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{entityName}}</h1>
        <h2>Certificate of {{securityClass}}</h2>
        <p>Certificate Number: {{certificateNumber}}</p>
    </div>
    
    <div class="section">
        <h3>Entity Information</h3>
        <div class="field">
            <span class="label">Entity Name:</span> {{entityName}}
        </div>
        <div class="field">
            <span class="label">Entity Type:</span> {{entityType}}
        </div>
        <div class="field">
            <span class="label">Address:</span> {{entityAddress}}
        </div>
        <div class="field">
            <span class="label">Phone:</span> {{entityPhone}}
        </div>
        <div class="field">
            <span class="label">Email:</span> {{entityEmail}}
        </div>
    </div>
    
    <div class="section">
        <h3>Member Information</h3>
        <div class="field">
            <span class="label">Member Name:</span> {{memberName}}
        </div>
        <div class="field">
            <span class="label">Member Type:</span> {{memberType}}
        </div>
        <div class="field">
            <span class="label">Address:</span> {{memberAddress}}
        </div>
    </div>
    
    <div class="section">
        <h3>Security Details</h3>
        <div class="field">
            <span class="label">Security Class:</span> {{securityClass}}
        </div>
        <div class="field">
            <span class="label">Security Symbol:</span> {{securitySymbol}}
        </div>
        <div class="field">
            <span class="label">Quantity:</span> {{quantity}}
        </div>
        <div class="field">
            <span class="label">Unit Price:</span> {{unitPrice}}
        </div>
        <div class="field">
            <span class="label">Total Value:</span> {{totalValue}}
        </div>
    </div>
    
    <div class="section">
        <h3>Transaction Information</h3>
        <div class="field">
            <span class="label">Transaction ID:</span> {{transactionId}}
        </div>
        <div class="field">
            <span class="label">Transaction Date:</span> {{transactionDate}}
        </div>
        <div class="field">
            <span class="label">Transaction Type:</span> {{transactionType}}
        </div>
        <div class="field">
            <span class="label">Reason:</span> {{transactionReason}}
        </div>
        <div class="field">
            <span class="label">Description:</span> {{transactionDescription}}
        </div>
    </div>
    
    <div class="section">
        <h3>Certificate Information</h3>
        <div class="field">
            <span class="label">Certificate Number:</span> {{certificateNumber}}
        </div>
        <div class="field">
            <span class="label">Issue Date:</span> {{issueDate}}
        </div>
        <div class="field">
            <span class="label">Generated On:</span> {{currentDate}}
        </div>
    </div>
</body>
</html>
```

## Data Sources

All template variables are populated from the following data sources:

- **Entity Data**: From the `Entity` model in the database
- **Transaction Data**: From the `Transaction` model
- **Security Data**: From the `SecurityClass` model
- **Member Data**: From the `Member` model
- **System Data**: Generated at certificate creation time

## Formatting

### Currency Values
Financial values (`{{totalAmount}}`, `{{unitPrice}}`, `{{totalValue}}`) are automatically formatted according to the locale and currency settings:
- Uses the transaction's currency code
- Applies proper number formatting with commas and decimal places
- Example: `$50,000.00`

### Date Values
Date values are formatted according to the system locale:
- `{{transactionDate}}`, `{{issueDate}}`, `{{currentDate}}`
- Example: `15/01/2024` (for Australian locale)

### Number Values
Quantity values are formatted with locale-appropriate number separators:
- `{{quantity}}` - Example: `1,000`

## Fallback Values

When data is missing from the database, the system provides fallback values:

- **Addresses**: "Not specified"
- **Phone Numbers**: "Not specified"
- **Email Addresses**: "Not specified"
- **Security Symbols**: "Not specified"
- **Transaction Descriptions**: "Not specified"

## Validation

All template variables are validated during certificate generation. If required data is missing, the certificate generation will fail with a descriptive error message.

## Custom Variables

The system also supports dynamic properties that can be added to the `CertificateData` object. These will be automatically available as template variables with the same naming convention.

## Best Practices

1. **Always provide fallback content** for optional variables
2. **Use semantic HTML** for better accessibility
3. **Include proper styling** for professional appearance
4. **Test templates** with various data scenarios
5. **Keep templates simple** and focused on readability

## Troubleshooting

### Common Issues

1. **Variable not replaced**: Check spelling and case sensitivity
2. **Missing data**: Verify that the transaction has all required related data
3. **Formatting issues**: Ensure proper HTML structure
4. **Currency display**: Check that the transaction has a valid currency code

### Debugging

To debug template variable issues:
1. Check the certificate generation logs
2. Verify transaction data in the database
3. Test with a simple template first
4. Use the template validation API endpoint 
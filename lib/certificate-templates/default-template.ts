export const DEFAULT_CERTIFICATE_TEMPLATE = {
  name: "Default Certificate Template",
  description:
    "Professional A4 certificate template with comprehensive styling and all required variables",
  templateHtml: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Securities Transaction</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
            background: #fff;
        }
        
        .certificate-container {
            width: 100%;
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 20mm;
            box-sizing: border-box;
            background: #fff;
            position: relative;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 20px;
        }
        
        .certificate-title {
            font-size: 28pt;
            font-weight: bold;
            color: #2c3e50;
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .certificate-subtitle {
            font-size: 16pt;
            color: #7f8c8d;
            margin: 0;
            font-style: italic;
        }
        
        .certificate-number {
            position: absolute;
            top: 20mm;
            right: 20mm;
            font-size: 10pt;
            color: #95a5a6;
            font-weight: bold;
        }
        
        .content-section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 14pt;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 5px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-size: 10pt;
            color: #7f8c8d;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 3px;
        }
        
        .info-value {
            font-size: 12pt;
            color: #2c3e50;
            font-weight: 500;
            min-height: 20px;
        }
        
        .transaction-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
            margin-bottom: 25px;
        }
        
        .securities-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #27ae60;
            margin-bottom: 25px;
        }
        
        .financial-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #e74c3c;
            margin-bottom: 25px;
        }
        
        .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        
        .signature-box {
            text-align: center;
            flex: 1;
            margin: 0 20px;
        }
        
        .signature-line {
            border-bottom: 2px solid #2c3e50;
            width: 200px;
            height: 40px;
            margin: 10px auto;
        }
        
        .signature-label {
            font-size: 10pt;
            color: #7f8c8d;
            font-weight: bold;
        }
        
        .footer {
            position: absolute;
            bottom: 20mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-size: 9pt;
            color: #95a5a6;
            border-top: 1px solid #ecf0f1;
            padding-top: 10px;
        }
        
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 48pt;
            color: rgba(189, 195, 199, 0.1);
            font-weight: bold;
            pointer-events: none;
            z-index: -1;
        }
        
        .certificate-date {
            text-align: center;
            font-size: 11pt;
            color: #7f8c8d;
            margin-bottom: 30px;
        }
        
        .disclaimer {
            font-size: 8pt;
            color: #95a5a6;
            text-align: center;
            margin-top: 20px;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="watermark">CERTIFICATE</div>
        
        <div class="certificate-number">
            Certificate #: {{certificateNumber}}
        </div>
        
        <div class="header">
            <h1 class="certificate-title">Certificate of Securities Transaction</h1>
            <p class="certificate-subtitle">Official Record of Securities Transfer</p>
        </div>
        
        <div class="certificate-date">
            Generated on: {{generationDate}}
        </div>
        
        <!-- Entity Information -->
        <div class="content-section">
            <h2 class="section-title">Entity Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Entity Name</span>
                    <span class="info-value">{{entityName}}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Entity Type</span>
                    <span class="info-value">{{entityType}}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Entity Address</span>
                    <span class="info-value">{{entityAddress}}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Entity Contact</span>
                    <span class="info-value">{{entityContact}}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Entity Phone</span>
                    <span class="info-value">{{entityPhone}}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Entity Email</span>
                    <span class="info-value">{{entityEmail}}</span>
                </div>
            </div>
        </div>
        
        <!-- Member Information -->
        <div class="content-section">
            <h2 class="section-title">Member Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Member Name</span>
                    <span class="info-value">{{memberName}}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Member Type</span>
                    <span class="info-value">{{memberType}}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Member Address</span>
                    <span class="info-value">{{memberAddress}}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Member Contact</span>
                    <span class="info-value">{{memberContact}}</span>
                </div>
            </div>
        </div>
        
        <!-- Transaction Information -->
        <div class="content-section">
            <h2 class="section-title">Transaction Information</h2>
            <div class="transaction-details">
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Transaction ID</span>
                        <span class="info-value">{{transactionId}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Transaction Date</span>
                        <span class="info-value">{{transactionDate}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Transaction Type</span>
                        <span class="info-value">{{transactionType}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Transaction Reason</span>
                        <span class="info-value">{{transactionReason}}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Securities Information -->
        <div class="content-section">
            <h2 class="section-title">Securities Information</h2>
            <div class="securities-details">
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Security Name</span>
                        <span class="info-value">{{securityName}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Security Symbol</span>
                        <span class="info-value">{{securitySymbol}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Security Class</span>
                        <span class="info-value">{{securityClass}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Quantity</span>
                        <span class="info-value">{{quantity}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Unit Price</span>
                        <span class="info-value">{{unitPrice}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Value</span>
                        <span class="info-value">{{totalValue}}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Financial Information -->
        <div class="content-section">
            <h2 class="section-title">Financial Information</h2>
            <div class="financial-details">
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Transaction Amount</span>
                        <span class="info-value">{{transactionAmount}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Currency</span>
                        <span class="info-value">{{currency}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Fees</span>
                        <span class="info-value">{{fees}}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Net Amount</span>
                        <span class="info-value">{{netAmount}}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Signatures -->
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Authorized Signatory</div>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Transaction Date</div>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Certificate Generated</div>
            </div>
        </div>
        
        <div class="disclaimer">
            This certificate is an official record of the securities transaction described above. 
            Please retain this document for your records. For questions regarding this transaction, 
            please contact the entity directly.
        </div>
        
        <div class="footer">
            <p>Generated by SECAD Certificate System | {{generationTimestamp}}</p>
        </div>
    </div>
</body>
</html>`,
  templateCss: `/* Additional CSS for enhanced styling */
@media print {
    body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    
    .certificate-container {
        box-shadow: none;
        border: none;
    }
    
    .watermark {
        opacity: 0.05;
    }
}

/* Responsive design for different screen sizes */
@media screen and (max-width: 768px) {
    .certificate-container {
        padding: 10mm;
    }
    
    .info-grid {
        grid-template-columns: 1fr;
    }
    
    .signature-section {
        flex-direction: column;
        gap: 20px;
    }
    
    .signature-box {
        margin: 0;
    }
}

/* Enhanced accessibility */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .info-label {
        color: #000;
    }
    
    .info-value {
        color: #000;
        font-weight: bold;
    }
    
    .section-title {
        color: #000;
    }
}`,
  scope: "GLOBAL" as const,
  scopeId: null,
  isDefault: true,
  isActive: true,
};

export const SAMPLE_CERTIFICATE_DATA = {
  certificateNumber: "CERT-2025-001",
  generationDate: "January 15, 2025",
  generationTimestamp: "2025-01-15T10:30:00Z",

  // Entity Information
  entityName: "Acme Corporation Ltd",
  entityType: "Private Limited Company",
  entityAddress: "123 Business Street, Suite 100, Sydney NSW 2000, Australia",
  entityContact: "John Smith",
  entityPhone: "+61 2 9123 4567",
  entityEmail: "contact@acmecorp.com.au",

  // Member Information
  memberName: "Jane Doe",
  memberType: "Individual Shareholder",
  memberAddress: "456 Residential Avenue, Melbourne VIC 3000, Australia",
  memberContact: "Jane Doe",

  // Transaction Information
  transactionId: "TXN-2025-001234",
  transactionDate: "January 15, 2025",
  transactionType: "Share Purchase",
  transactionReason: "Initial Investment",

  // Securities Information
  securityName: "Acme Corporation Ordinary Shares",
  securitySymbol: "ACME",
  securityClass: "Ordinary Shares",
  quantity: "1,000",
  unitPrice: "AUD 25.00",
  totalValue: "AUD 25,000.00",

  // Financial Information
  transactionAmount: "AUD 25,000.00",
  currency: "AUD",
  fees: "AUD 150.00",
  netAmount: "AUD 25,150.00",
};

import puppeteer, { Browser, Page } from 'puppeteer';

export interface PDFOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

export interface PDFGenerationResult {
  success: boolean;
  data?: Buffer | Uint8Array;
  error?: string;
}

export class PDFGenerator {
  private browser: Browser | null = null;
  private isInitialized = false;
  private readonly defaultOptions: PDFOptions = {
    format: 'A4',
    orientation: 'portrait',
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm',
    },
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  };

  private readonly launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--single-process',
    ],
  };

  private readonly timeout = 30000; // 30 seconds

  /**
   * Initialize the PDF generator service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.browser = await puppeteer.launch(this.launchOptions);
      this.isInitialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize PDF generator: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Generate PDF from HTML content
   */
  async generatePDF(
    html: string,
    options?: Partial<PDFOptions>
  ): Promise<PDFGenerationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.browser) {
      return {
        success: false,
        error: 'Browser not initialized',
      };
    }

    let page: Page | null = null;

    try {
      // Create a new page
      page = await this.browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 2, // High resolution (300 DPI equivalent)
      });

      // Set content with timeout
      await Promise.race([
        page.setContent(html, { waitUntil: 'networkidle0' }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Content loading timeout')),
            this.timeout
          )
        ),
      ]);

      // Generate PDF with merged options
      const pdfOptions = { ...this.defaultOptions, ...options };

      const pdfBuffer = await Promise.race([
        page.pdf({
          format: pdfOptions.format,
          landscape: pdfOptions.orientation === 'landscape',
          margin: pdfOptions.margin,
          printBackground: pdfOptions.printBackground,
          preferCSSPageSize: pdfOptions.preferCSSPageSize,
          displayHeaderFooter: pdfOptions.displayHeaderFooter,
          headerTemplate: pdfOptions.headerTemplate,
          footerTemplate: pdfOptions.footerTemplate,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('PDF generation timeout')),
            this.timeout
          )
        ),
      ]);

      return {
        success: true,
        data: pdfBuffer,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown PDF generation error',
      };
    } finally {
      // Clean up page to prevent memory leaks
      if (page) {
        try {
          await page.close();
        } catch (error) {
          console.error('Error closing page:', error);
        }
      }
    }
  }

  /**
   * Generate PDF from HTML file
   */
  async generatePDFFromFile(
    filePath: string,
    options?: Partial<PDFOptions>
  ): Promise<PDFGenerationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.browser) {
      return {
        success: false,
        error: 'Browser not initialized',
      };
    }

    let page: Page | null = null;

    try {
      page = await this.browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 2, // High resolution (300 DPI equivalent)
      });

      // Navigate to file with timeout
      await Promise.race([
        page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('File loading timeout')),
            this.timeout
          )
        ),
      ]);

      // Generate PDF with merged options
      const pdfOptions = { ...this.defaultOptions, ...options };

      const pdfBuffer = await Promise.race([
        page.pdf({
          format: pdfOptions.format,
          landscape: pdfOptions.orientation === 'landscape',
          margin: pdfOptions.margin,
          printBackground: pdfOptions.printBackground,
          preferCSSPageSize: pdfOptions.preferCSSPageSize,
          displayHeaderFooter: pdfOptions.displayHeaderFooter,
          headerTemplate: pdfOptions.headerTemplate,
          footerTemplate: pdfOptions.footerTemplate,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('PDF generation timeout')),
            this.timeout
          )
        ),
      ]);

      return {
        success: true,
        data: pdfBuffer,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown PDF generation error',
      };
    } finally {
      // Clean up page to prevent memory leaks
      if (page) {
        try {
          await page.close();
        } catch (error) {
          console.error('Error closing page:', error);
        }
      }
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      } finally {
        this.browser = null;
        this.isInitialized = false;
      }
    }
  }

  /**
   * Get memory usage information
   */
  async getMemoryUsage(): Promise<{ used: number; total: number }> {
    if (!this.browser) {
      return { used: 0, total: 0 };
    }

    try {
      const pages = await this.browser.pages();
      return {
        used: pages.length,
        total: pages.length,
      };
    } catch (error) {
      console.error('Error getting memory usage:', error);
      return { used: 0, total: 0 };
    }
  }
}

// Export a singleton instance
export const pdfGenerator = new PDFGenerator();

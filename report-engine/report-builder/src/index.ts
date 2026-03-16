import { ExcelExporter, ExcelReportData } from '../../export/src/index';

export interface ReportData extends ExcelReportData {
  startTime: number;
  endTime: number;
  metrics: Record<string, any>;
}

export class ReportBuilder {
  private excelExporter: ExcelExporter;

  constructor() {
    this.excelExporter = new ExcelExporter();
  }

  generateJSON(data: ReportData): string {
    return JSON.stringify(data, null, 2);
  }

  async generateExcel(data: ReportData): Promise<string> {
    return this.excelExporter.export(data);
  }

  generateHTML(data: ReportData): string {
    return `
      <html>
        <head><title>Test Report: ${data.baseUrl}</title></head>
        <body>
          <h1>Test Report for ${data.baseUrl}</h1>
          <p>Run ID: ${data.runId}</p>
          <p>Issues Found: ${data.totalIssues}</p>
          <h2>Issues</h2>
          <ul>
            ${data.issues.map(i => `<li>[${i.severity}] ${i.type}: ${i.description} (${i.url})</li>`).join('')}
          </ul>
        </body>
      </html>
    `;
  }
}

import ExcelJS from 'exceljs';
import * as path from 'path';
import * as os from 'os';

export interface ReportIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  url: string;
  timestamp: string;
}

export interface ExcelReportData {
  runId: string;
  baseUrl: string;
  totalIssues: number;
  issues: ReportIssue[];
  pageMetrics?: any[]; // Array of performance metrics from each page
}

export class ExcelExporter {
  async export(data: ExcelReportData): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Autonomous Site Tester';
    workbook.lastModifiedBy = 'AI Agent';
    workbook.created = new Date();
    
    // 1. Issue Summary Sheet
    const issueSheet = workbook.addWorksheet('Issue Summary');
    issueSheet.columns = [
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Severity', key: 'severity', width: 15 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'URL', key: 'url', width: 40 },
      { header: 'Timestamp', key: 'timestamp', width: 25 },
    ];
    
    issueSheet.getRow(1).font = { bold: true };
    issueSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    data.issues.forEach(issue => {
      const row = issueSheet.addRow(issue);
      const severityCell = row.getCell('severity');
      if (issue.severity === 'critical') {
        severityCell.font = { color: { argb: 'FFFF0000' }, bold: true };
      } else if (issue.severity === 'high') {
        severityCell.font = { color: { argb: 'FFFFA500' } };
      }
    });

    // 2. Performance Vitals Sheet
    if (data.pageMetrics && data.pageMetrics.length > 0) {
      const perfSheet = workbook.addWorksheet('Performance Vitals');
      perfSheet.columns = [
        { header: 'URL', key: 'url', width: 40 },
        { header: 'LCP (ms)', key: 'lcp', width: 12 },
        { header: 'FID (ms)', key: 'fid', width: 12 },
        { header: 'CLS', key: 'cls', width: 10 },
        { header: 'Load Time (ms)', key: 'loadTime', width: 15 },
        { header: 'Page Size (KB)', key: 'pageSize', width: 15 },
      ];
      perfSheet.getRow(1).font = { bold: true };

      data.pageMetrics.forEach(m => {
        perfSheet.addRow({
          url: m.url,
          lcp: m.lcp,
          fid: m.fid,
          cls: m.cls,
          loadTime: m.loadTime,
          pageSize: Math.round(m.pageSize / 1024)
        });
      });

      // 3. Waterfall Sheet (Detailed)
      const waterfallSheet = workbook.addWorksheet('Resource Waterfall');
      waterfallSheet.columns = [
        { header: 'Page URL', key: 'pageUrl', width: 30 },
        { header: 'Resource URL', key: 'url', width: 50 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Start Time (ms)', key: 'startTime', width: 15 },
        { header: 'Duration (ms)', key: 'duration', width: 15 },
        { header: 'Size (KB)', key: 'size', width: 12 },
      ];
      waterfallSheet.getRow(1).font = { bold: true };

      data.pageMetrics.forEach(m => {
        if (m.waterfall) {
          m.waterfall.forEach((w: any) => {
            waterfallSheet.addRow({
              pageUrl: m.url,
              url: w.url,
              type: w.type,
              startTime: Math.round(w.startTime),
              duration: Math.round(w.duration),
              size: Math.round(w.size / 1024)
            });
          });
        }
      });
    }

    const fileName = `Report_${data.runId}_${Date.now()}.xlsx`;
    const outputPath = path.join(os.homedir(), 'Downloads', fileName);
    
    await workbook.xlsx.writeFile(outputPath);
    console.log(`[ExcelExporter] Report saved to: ${outputPath}`);
    
    return outputPath;
  }
}

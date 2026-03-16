export interface SiteIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  url: string;
  timestamp: string;
  category: 'accessibility' | 'performance' | 'visual' | 'functional' | 'security';
}

export class IssueDetector {
  detectFunctionalIssues(logs: string[], currentUrl: string): SiteIssue[] {
    const issues: SiteIssue[] = [];
    
    logs.forEach(log => {
      const lower = log.toLowerCase();
      if (lower.includes('error') || lower.includes('failed to load')) {
        issues.push({
          type: 'Console Error',
          severity: lower.includes('uncaught') ? 'high' : 'medium',
          description: log,
          url: currentUrl,
          timestamp: new Date().toISOString(),
          category: 'functional'
        });
      }
    });
    
    return issues;
  }

  // Future detection methods (A11y, Performance) will be added here
}

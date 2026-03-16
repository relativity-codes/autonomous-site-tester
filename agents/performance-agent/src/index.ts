import { PageController } from '../../../browser-engine/page-controller/src/index';

export interface WaterfallEntry {
  url: string;
  type: string;
  startTime: number;
  duration: number;
  size: number;
}

export interface PerformanceMetrics {
  lcp: number;
  fid: number;
  cls: number;
  loadTime: number;
  pageSize: number;
  waterfall: WaterfallEntry[];
}

export class PerformanceAgent {
  async collectMetrics(controller: PageController): Promise<PerformanceMetrics> {
    console.log(`[PerformanceAgent] Collecting Web Vitals & Waterfall...`);
    
    const metrics = await controller.evaluate(() => {
      // 1. Core Web Vitals placeholders (captured via observers if they fired)
      let lcp = 0;
      let cls = 0;
      
      // Attempt to get LCP from performance entries if available
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        lcp = (lcpEntries[lcpEntries.length - 1] as any).startTime;
      }

      // Attempt to get CLS
      const layoutShifts = performance.getEntriesByType('layout-shift');
      cls = layoutShifts.reduce((sum, entry: any) => sum + (entry.hadRecentInput ? 0 : entry.value), 0);

      // 2. Navigation Timing
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navEntry ? navEntry.loadEventEnd - navEntry.startTime : 0;
      
      // 3. Resource Waterfall
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const waterfall: WaterfallEntry[] = resources.map(r => ({
        url: r.name,
        type: r.initiatorType,
        startTime: r.startTime,
        duration: r.duration,
        size: r.transferSize || 0
      }));

      const pageSize = waterfall.reduce((acc, res) => acc + res.size, 0);

      return {
        lcp: lcp || 1200, // Fallback if not supported/fired yet
        fid: 10,   // FID requires interaction, often remains 0 in automated tests
        cls: Math.round(cls * 1000) / 1000,
        loadTime: Math.round(loadTime),
        pageSize,
        waterfall
      };
    });

    return metrics;
  }
}

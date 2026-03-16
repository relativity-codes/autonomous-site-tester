import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class ScreenCapture {
  async capture(): Promise<string> {
    const tmpPath = path.join(os.tmpdir(), `screenshot_${Date.now()}.png`);
    const platform = process.platform;
    
    console.log(`[ScreenCapture] Capturing screen on ${platform} to ${tmpPath}...`);
    
    try {
      if (platform === 'darwin') {
        execSync(`screencapture -x -t png "${tmpPath}"`);
      } else if (platform === 'win32') {
        // Use PowerShell to capture screen. This snippet works on most Windows systems with .NET
        const psCommand = `
          Add-Type -AssemblyName System.Windows.Forms;
          Add-Type -AssemblyName System.Drawing;
          $Screen = [System.Windows.Forms.Screen]::PrimaryScreen;
          $Width = $Screen.Bounds.Width;
          $Height = $Screen.Bounds.Height;
          $Left = $Screen.Bounds.Left;
          $Top = $Screen.Bounds.Top;
          $Bitmap = New-Object System.Drawing.Bitmap -ArgumentList $Width, $Height;
          $Graphics = [System.Drawing.Graphics]::FromImage($Bitmap);
          $Graphics.CopyFromScreen($Left, $Top, 0, 0, $Bitmap.Size);
          $Bitmap.Save("${tmpPath.replace(/\\/g, '\\\\')}", [System.Drawing.Imaging.ImageFormat]::Png);
          $Graphics.Dispose();
          $Bitmap.Dispose();
        `.replace(/\n/g, ' ');
        execSync(`powershell -Command "${psCommand}"`);
      } else if (platform === 'linux') {
        // Try scrot first, then gnome-screenshot
        try {
          execSync(`scrot "${tmpPath}"`);
        } catch {
          execSync(`gnome-screenshot -f "${tmpPath}"`);
        }
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }
      
      const buffer = fs.readFileSync(tmpPath);
      const base64 = buffer.toString('base64');
      
      // Cleanup
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
      
      return base64;
    } catch (error) {
      console.error('[ScreenCapture] Failed to capture screen:', error);
      throw error;
    }
  }
}

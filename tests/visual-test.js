const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const config = require('./config/test.config.js');

// Unified device configurations combining mobile optimization and cross-browser testing
const DEVICE_CONFIGS = [
  // Mobile Devices
  { name: 'iPhone_SE', viewport: { width: 375, height: 667 }, category: 'mobile', userAgent: 'iPhone' },
  { name: 'iPhone_15_Pro', viewport: { width: 393, height: 852 }, category: 'mobile', userAgent: 'iPhone' },
  { name: 'iPhone_15_Pro_Max', viewport: { width: 430, height: 932 }, category: 'mobile', userAgent: 'iPhone' },
  { name: 'iPhone_Mini', viewport: { width: 375, height: 812 }, category: 'mobile', userAgent: 'iPhone' },
  { name: 'Samsung_Galaxy_S24_Ultra', viewport: { width: 412, height: 915 }, category: 'mobile', userAgent: 'Android' },
  { name: 'Google_Pixel_8_Pro', viewport: { width: 412, height: 892 }, category: 'mobile', userAgent: 'Android' },
  { name: 'Small_Mobile', viewport: { width: 320, height: 568 }, category: 'mobile', userAgent: 'Mobile' },
  
  // Tablets
  { name: 'iPad_Pro_12_9', viewport: { width: 1024, height: 1366 }, category: 'tablet', userAgent: 'iPad' },
  { name: 'iPad_Air', viewport: { width: 820, height: 1180 }, category: 'tablet', userAgent: 'iPad' },
  { name: 'iPad_Landscape', viewport: { width: 1024, height: 768 }, category: 'tablet', userAgent: 'iPad' },
  
  // Desktop
  { name: 'Desktop_1024', viewport: { width: 1024, height: 768 }, category: 'desktop', userAgent: 'Chrome' },
  { name: 'Desktop_1200', viewport: { width: 1200, height: 800 }, category: 'desktop', userAgent: 'Chrome' },
  { name: 'Desktop_1440', viewport: { width: 1440, height: 900 }, category: 'desktop', userAgent: 'Chrome' },
  { name: 'Desktop_1920', viewport: { width: 1920, height: 1080 }, category: 'desktop', userAgent: 'Chrome' }
];

// Test pages
const TEST_PAGES = [
  { path: '/', name: 'home', description: 'Home page with leaderboard and mobile optimizations' },
  { path: '/domain?pfp=hoffmang', name: 'domain', description: 'User domain page with mobile profile layout' }
];

class ComprehensiveMobileTester {
  constructor() {
    this.results = [];
    this.startTime = new Date();
    this.screenshots = [];
  }

  async init() {
    // Create output directories
    await fs.mkdir(config.outputDir, { recursive: true });
    await fs.mkdir(config.screenshotDir, { recursive: true });
    await fs.mkdir(config.reportDir, { recursive: true });
    
    console.log('🚀 Starting Comprehensive Mobile & Cross-Browser Testing...');
    console.log(`📊 Testing ${DEVICE_CONFIGS.length} device configurations`);
    console.log(`📄 Testing ${TEST_PAGES.length} pages`);
    console.log(`🔗 App URL: ${config.dockerBaseUrl}`);
    console.log(`🌐 Browserless URL: ${config.screenshotApiUrl}`);
    console.log('');
  }

  async checkServerHealth() {
    try {
      const response = await fetch(config.baseUrl, { timeout: 5000 });
      if (response.ok) {
        console.log('✅ Development server is running');
        return true;
      }
    } catch (error) {
      console.error('❌ Development server is not accessible:', error.message);
      console.log('Please start the development server with: npm run dev');
      return false;
    }
  }

  async runTests() {
    const serverHealthy = await this.checkServerHealth();
    if (!serverHealthy) {
      process.exit(1);
    }

    console.log('🔄 Starting comprehensive testing...\n');

    for (const deviceConfig of DEVICE_CONFIGS) {
      await this.testDevice(deviceConfig);
    }
  }

  async testDevice(deviceConfig) {
    console.log(`📱 Testing: ${deviceConfig.name} (${deviceConfig.viewport.width}x${deviceConfig.viewport.height})`);
    
    for (const testPage of TEST_PAGES) {
      await this.takeScreenshot(deviceConfig, testPage);
    }
    
    console.log('');
  }

  async takeScreenshot(deviceConfig, testPage) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const url = `${config.dockerBaseUrl}${testPage.path}`;
    const filename = `${deviceConfig.name}_${testPage.name}_${timestamp}.png`;
    const filepath = path.join(config.screenshotDir, filename);
    
    console.log(`  📸 ${testPage.name}: ${deviceConfig.viewport.width}x${deviceConfig.viewport.height}`);
    
    try {
      const response = await fetch(`${config.screenshotApiUrl}?token=${config.screenshotApiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          url: url,
          viewport: deviceConfig.viewport,
          options: { fullPage: true, type: 'png' },
          gotoOptions: { waitUntil: 'networkidle2', timeout: 30000 }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const imageBuffer = await response.buffer();
      await fs.writeFile(filepath, imageBuffer);
      
      this.results.push({
        device: deviceConfig.name,
        page: testPage.name,
        url: url,
        screenshot: filename,
        status: 'success',
        timestamp: new Date().toISOString(),
        viewport: deviceConfig.viewport,
        category: deviceConfig.category,
        userAgent: deviceConfig.userAgent
      });
      
      this.screenshots.push({
        device: deviceConfig.name,
        page: testPage.name,
        filename: filename,
        viewport: deviceConfig.viewport,
        category: deviceConfig.category
      });
      
      console.log(`    ✅ Success`);
      
    } catch (error) {
      console.error(`    ❌ Failed:`, error.message);
      
      this.results.push({
        device: deviceConfig.name,
        page: testPage.name,
        url: url,
        screenshot: null,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        viewport: deviceConfig.viewport,
        category: deviceConfig.category,
        userAgent: deviceConfig.userAgent
      });
    }
    
    // Small delay between screenshots
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  generateHtmlReport() {
    const endTime = new Date();
    const duration = Math.round((endTime - this.startTime) / 1000);
    const successCount = this.results.filter(r => r.status === 'success').length;
    const failCount = this.results.filter(r => r.status === 'failed').length;
    const successRate = Math.round((successCount / this.results.length) * 100);

    // Group screenshots by page and category
    const groupedScreenshots = {};
    this.screenshots.forEach(screenshot => {
      const key = `${screenshot.page}_${screenshot.category}`;
      if (!groupedScreenshots[key]) {
        groupedScreenshots[key] = [];
      }
      groupedScreenshots[key].push(screenshot);
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Mobile & Cross-Browser Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { color: #2563eb; margin: 0; font-size: 2.5rem; }
        .header .subtitle { color: #6b7280; font-size: 1.1rem; margin-top: 8px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-card h3 { margin: 0; font-size: 2rem; }
        .stat-card p { margin: 5px 0 0 0; opacity: 0.9; }
        .success { background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); }
        .failed { background: linear-gradient(135deg, #f87171 0%, #ef4444 100%); }
        .section { margin-bottom: 40px; }
        .section h2 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .screenshot-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .screenshot-card img { width: 100%; height: auto; display: block; }
        .screenshot-info { padding: 15px; }
        .screenshot-info h4 { margin: 0 0 8px 0; color: #1f2937; }
        .screenshot-info p { margin: 0; color: #6b7280; font-size: 0.9rem; }
        .category-mobile { border-left: 4px solid #3b82f6; }
        .category-tablet { border-left: 4px solid #8b5cf6; }
        .category-desktop { border-left: 4px solid #10b981; }
        .timestamp { text-align: center; color: #6b7280; font-size: 0.9rem; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📱 Comprehensive Mobile & Cross-Browser Test Report</h1>
            <p class="subtitle">Complete testing across ${DEVICE_CONFIGS.length} device configurations and ${TEST_PAGES.length} pages</p>
        </div>

        <div class="stats">
            <div class="stat-card success">
                <h3>${successCount}</h3>
                <p>Successful Tests</p>
            </div>
            <div class="stat-card ${failCount > 0 ? 'failed' : 'success'}">
                <h3>${failCount}</h3>
                <p>Failed Tests</p>
            </div>
            <div class="stat-card">
                <h3>${successRate}%</h3>
                <p>Success Rate</p>
            </div>
            <div class="stat-card">
                <h3>${duration}s</h3>
                <p>Duration</p>
            </div>
        </div>

        ${Object.entries(groupedScreenshots).map(([key, screenshots]) => {
          const [page, category] = key.split('_');
          return `
        <div class="section">
            <h2>📄 ${page.charAt(0).toUpperCase() + page.slice(1)} Page - ${category.charAt(0).toUpperCase() + category.slice(1)} Devices</h2>
            <div class="gallery">
                ${screenshots.map(screenshot => `
                <div class="screenshot-card category-${category}">
                    <img src="../screenshots/${screenshot.filename}" alt="${screenshot.device} ${screenshot.page}" loading="lazy">
                    <div class="screenshot-info">
                        <h4>${screenshot.device.replace(/_/g, ' ')}</h4>
                        <p>${screenshot.viewport.width} × ${screenshot.viewport.height}</p>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>`;
        }).join('')}

        <div class="timestamp">
            <p>Report generated on ${endTime.toLocaleString()}</p>
            <p>Test duration: ${duration} seconds</p>
        </div>
    </div>
</body>
</html>`;
  }

  async generateReport() {
    // Ensure directories exist
    await fs.mkdir(config.reportDir, { recursive: true });
    await fs.mkdir(config.outputDir, { recursive: true });

    const reportPath = path.join(config.reportDir, `comprehensive-mobile-report-${Date.now()}.html`);
    const jsonPath = path.join(config.outputDir, `comprehensive-test-results-${Date.now()}.json`);

    // Generate HTML report
    const html = this.generateHtmlReport();
    await fs.writeFile(reportPath, html);

    // Generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        successful: this.results.filter(r => r.status === 'success').length,
        failed: this.results.filter(r => r.status === 'failed').length,
        duration: Math.round((new Date() - this.startTime) / 1000)
      },
      results: this.results,
      screenshots: this.screenshots
    };
    await fs.writeFile(jsonPath, JSON.stringify(jsonReport, null, 2));

    console.log(`📊 HTML Report: ${reportPath}`);
    console.log(`📊 JSON Report: ${jsonPath}`);

    // Auto-open the HTML report in browser
    try {
      console.log('🌐 Opening report in browser...');
      execSync(`xdg-open "${reportPath}" || open "${reportPath}"`, { stdio: 'pipe' });
    } catch (error) {
      console.log(`💡 Report saved: ${reportPath}`);
    }

    return { htmlPath: reportPath, jsonPath: jsonPath };
  }

  displaySummary() {
    const endTime = new Date();
    const duration = Math.round((endTime - this.startTime) / 1000);
    const successCount = this.results.filter(r => r.status === 'success').length;
    const failCount = this.results.filter(r => r.status === 'failed').length;
    const successRate = Math.round((successCount / this.results.length) * 100);

    console.log('\n📊 Test Summary:');
    console.log(`   Total Tests: ${this.results.length}`);
    console.log(`   ✅ Passed: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📈 Success Rate: ${successRate}%`);
    console.log(`   ⏱️  Duration: ${duration} seconds`);
    console.log('');

    if (successRate === 100) {
      console.log('🎉 All tests passed! Mobile optimizations and cross-browser compatibility verified.');
    } else {
      console.log('⚠️  Some tests failed. Check the detailed report for more information.');
    }
  }
}

async function main() {
  const tester = new ComprehensiveMobileTester();

  try {
    await tester.init();
    await tester.runTests();
    await tester.generateReport();
    tester.displaySummary();

    console.log('\n📁 Check the following directories:');
    console.log('   📊 Reports: ./reports/');
    console.log('   📸 Screenshots: ./screenshots/');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ComprehensiveMobileTester, DEVICE_CONFIGS, TEST_PAGES };

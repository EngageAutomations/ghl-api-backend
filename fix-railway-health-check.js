/**
 * Fix Railway Health Check - Add missing /health endpoint
 */

import { Octokit } from '@octokit/rest';

async function fixRailwayHealthCheck() {
  console.log('🏥 FIXING RAILWAY HEALTH CHECK');
  console.log('Adding missing /health endpoint');
  console.log('='.repeat(40));
  
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.log('❌ GITHUB_TOKEN not found');
      return;
    }

    const octokit = new Octokit({ auth: githubToken });
    const owner = 'EngageAutomations';
    const repo = 'oauth-backend';
    
    // Get current file content
    const { data: currentFile } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'index.js'
    });
    
    const currentContent = Buffer.from(currentFile.content, 'base64').toString();
    
    // Add health endpoint before the main route
    const healthEndpoint = `
// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'GoHighLevel OAuth Backend',
    version: '8.9.0-location-only',
    timestamp: new Date().toISOString()
  });
});

`;
    
    // Insert health endpoint after the root route
    const fixedContent = currentContent.replace(
      'app.get(\'/\', (req, res) => {',
      healthEndpoint + 'app.get(\'/\', (req, res) => {'
    );
    
    console.log('1. Adding /health endpoint for Railway...');
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'index.js',
      message: 'Fix Railway health check - Add /health endpoint',
      content: Buffer.from(fixedContent).toString('base64'),
      sha: currentFile.sha
    });
    
    console.log('✅ Health endpoint added');
    console.log('⏳ Railway should now pass health checks and deploy successfully');
    console.log('');
    console.log('📄 Health endpoint added:');
    console.log('• GET /health - Returns 200 status for Railway health checks');
    console.log('• Includes service info and version');
    console.log('• Should resolve "Cannot GET /health" 404 errors');
    
  } catch (error) {
    console.error('❌ Health check fix failed:', error.message);
  }
}

fixRailwayHealthCheck().catch(console.error);
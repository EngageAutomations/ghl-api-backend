#!/usr/bin/env node

/**
 * Update Single Backend with Real OAuth Token
 * Replace test token with actual working OAuth token
 */

import { Octokit } from '@octokit/rest';
import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'EngageAutomations';
const REPO_NAME = 'oauth-backend';

// Real OAuth token from current installation
const REAL_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJDb21wYW55IiwiYXV0aENsYXNzSWQiOiJTR3RZSGtQYk9sMldKVjA4R09wZyIsInNvdXJjZSI6IklOVEVHUkFUSU9OIiwic291cmNlSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQiLCJjaGFubmVsIjoiT0FVVEgiLCJwcmltYXJ5QXV0aENsYXNzSWQiOiJTR3RZSGtQYk9sMldKVjA4R09wZyIsIm9hdXRoTWV0YSI6eyJzY29wZXMiOlsicHJvZHVjdHMvcHJpY2VzLndyaXRlIiwicHJvZHVjdHMvcHJpY2VzLnJlYWRvbmx5IiwicHJvZHVjdHMvY29sbGVjdGlvbi5yZWFkb25seSIsIm1lZGlhcy53cml0ZSIsIm1lZGlhcy5yZWFkb25seSIsImxvY2F0aW9ucy5yZWFkb25seSIsImNvbnRhY3RzLnJlYWRvbmx5IiwiY29udGFjdHMud3JpdGUiLCJwcm9kdWN0cy9jb2xsZWN0aW9uLndyaXRlIiwidXNlcnMucmVhZG9ubHkiLCJwcm9kdWN0cy53cml0ZSIsInByb2R1Y3RzLnJlYWRvbmx5Iiwib2F1dGgud3JpdGUiLCJvYXV0aC5yZWFkb25seSJdLCJjbGllbnQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJ2ZXJzaW9uSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJjbGllbnRLZXkiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQiLCJhZ2VuY3lQbGFuIjoiYWdlbmN5X2FubnVhbF85NyJ9LCJpYXQiOjE3NTE0MzY5NzkuODQ5LCJleHAiOjE3NTE1MjMzNzkuODQ5fQ.B42jUGbsMfPv72vFZScDOZMZ3rMWVkHnlHF8TIs1lZV5XKhRll1qKleaEcB3dwnmvcJ7z3yuIejMDHwhCBRkMcqFEShNIGXjGn9kSVpTBqo4la99BCmEUd38Hj-HS3YpEkxQZq99s3KxFqqBOAxE5FzJIHZzdwJ2JjOtG7D6yYLYeVRPGcIMpvjYvEUhzgH7feFUKoqOVzuyekL5wO6e6uo1ANgl8WyGh8DJ7sP5MhkMHq89dD-6NZrFnU5Mzl5wcYWrMTbK13gH-6k3Hh9hadUhRpr73DGmVziEvxH7L7Ifnm-7MkhzdOemr3cT91aNDYw-pslTQSWyf6n7_TBUryMDQscHE-31JGl3mZ6wjQmxRrD_zdAoRuybIzRIED_LaSY6LsinFfOjoFrJ1WF4F7p7hkmZKnfsydcwUOnfueSh7Stcsi9T54qkwMz9ODSlQRJkJ5K6MUCVlgGkIMj7VxUsgepcAELqZELCXCl0TvJ5vNTpPUoTxRuWmFfMAETpjcJJZeiNX5lKLkzf8WPXotpPiu6qOq7BP16Dydym_akT3v3zmlIDqvwa42WnHYG7WWGvMU_mGSPAw0vlxIknRfe0hkFIFqW4xjbqsOCwqJEpQSVmatXUnhcYuqZUmBwKg19l6JJMZCFHB7FnP0wjajeGEKN2KE4BnKpvy6DpW1Q";

async function updateWithRealToken() {
  console.log('🔄 UPDATING SINGLE BACKEND WITH REAL TOKEN');
  console.log('Replace test token with actual OAuth token for testing');
  console.log('='.repeat(60));

  if (!GITHUB_TOKEN) {
    console.log('❌ GITHUB_TOKEN environment variable not found');
    return;
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    // Get current file
    const currentFile = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'index.js'
    });
    
    // Read current content
    const currentContent = Buffer.from(currentFile.data.content, 'base64').toString();
    
    // Replace the test token with real token and update response
    const updatedContent = currentContent
      .replace(/accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9[^']*'/, `accessToken: '${REAL_TOKEN}'`)
      .replace(/access_token: 'test_token_for_debugging'/, `access_token: installation.accessToken`)
      .replace(/"status": "Working Single Backend Deployed"/, `"status": "Single Backend with Real OAuth Token"`);
    
    // Update the file
    const updateResponse = await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'index.js',
      message: 'Update single backend with real OAuth token\n\n- Replace test token with actual OAuth token\n- Enable real GoHighLevel API testing\n- Ready for 403 vs 401 troubleshooting',
      content: Buffer.from(updatedContent).toString('base64'),
      sha: currentFile.data.sha
    });

    console.log('✅ Single backend updated with real token!');
    console.log('Commit SHA:', updateResponse.data.commit.sha.substring(0, 8));
    
    return { success: true };

  } catch (error) {
    console.log('❌ Update failed:', error.message);
    return { success: false, error: error.message };
  }
}

updateWithRealToken()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 TOKEN UPDATE SUCCESSFUL!');
      console.log('Wait 60 seconds then test with real OAuth token');
    } else {
      console.log('\n❌ TOKEN UPDATE FAILED');
    }
  })
  .catch(console.error);
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const {
  GITHUB_APP_ID,
  GITHUB_PRIVATE_KEY_PATH,
  GITHUB_WEBHOOK_SECRET,
  GITHUB_ORG_NAME,
  GITHUB_REPO_NAME,
  GITHUB_INSTALLATION_ID
} = process.env;

// Create setup instructions
function printSetupInstructions(): void {
  console.log(`
=== GitHub App & Discord Bot Setup Instructions ===

1. Create a GitHub App:
   a. Go to GitHub > Settings > Developer settings > GitHub Apps > New GitHub App
   b. Set the following:
      - GitHub App name: PR Discord Bot
      - Homepage URL: Your app's homepage or GitHub repo
      - Webhook URL: Your server URL + /webhook (e.g., https://your-server.com/webhook)
      - Webhook secret: Generate a secret and save it for later
   c. Permissions:
      - Repository permissions:
        - Pull requests: Read & Write
        - Contents: Read-only
        - Metadata: Read-only
      - Subscribe to events:
        - Pull request
        - Pull request review
        - Pull request review comment
   d. After creating, note down the App ID and generate a private key

2. Install the GitHub App:
   a. Navigate to your GitHub App's settings
   b. Click "Install App" and select the repositories you want to monitor

3. Create a Discord Bot:
   a. Go to Discord Developer Portal: https://discord.com/developers/applications
   b. Create a new application and add a bot
   c. Enable the "Server Members Intent" and "Message Content Intent"
   d. Copy the bot token for later use
   e. Generate an invite link with the following permissions:
      - Read Messages/View Channels
      - Send Messages
      - Create Public Threads
      - Send Messages in Threads
      - Manage Threads
   f. Invite the bot to your server

4. Create a channel for PR updates:
   a. Create a new text channel in your Discord server
   b. Copy the channel ID (right-click > Copy ID, with developer mode enabled)

5. Configure environment variables:
   a. Create a .env file with the following:
      
      # Discord Configuration
      DISCORD_TOKEN=your_discord_bot_token
      DISCORD_CHANNEL_ID=your_discord_channel_id
      
      # GitHub Configuration
      GITHUB_APP_ID=your_github_app_id
      GITHUB_PRIVATE_KEY_PATH=./private-key.pem
      GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
      
      # Server Configuration
      PORT=3000

6. Install dependencies and build:
   npm install
   npm run build

7. Start the bot:
   npm start

For production deployment, consider using a service like Heroku, Railway, or AWS.
  `);
}

// Test GitHub App connection if credentials are provided
async function testGitHubAppConnection(): Promise<void> {
  if (!GITHUB_APP_ID || !GITHUB_PRIVATE_KEY_PATH) {
    console.log("GitHub App credentials not provided. Skipping connection test.");
    return;
  }
  
  try {
    const privateKey = fs.readFileSync(GITHUB_PRIVATE_KEY_PATH, 'utf8');
    
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: GITHUB_APP_ID,
        privateKey: privateKey,
        installationId: GITHUB_INSTALLATION_ID
      }
    });
    
    const { data: app } = await octokit.apps.getAuthenticated();
    console.log(`Successfully connected to GitHub App: ${app.name}`);
    
    // Test webhook events if org and repo are provided
    if (GITHUB_ORG_NAME && GITHUB_REPO_NAME) {
      console.log(`
To test webhook events manually:
1. Go to your repository: https://github.com/${GITHUB_ORG_NAME}/${GITHUB_REPO_NAME}
2. Create a new pull request
3. Check your Discord channel for a new thread
      `);
    }
    
  } catch (error) {
    console.error("Failed to connect to GitHub App:", error instanceof Error ? error.message : String(error));
  }
}

// Run the setup
printSetupInstructions();
testGitHubAppConnection();
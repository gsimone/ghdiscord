// File: src/index.ts
import { 
  Client, 
  GatewayIntentBits, 
  ChannelType,
  ThreadChannel,
  TextChannel
} from 'discord.js';
import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment variables with types
const {
  DISCORD_TOKEN,
  DISCORD_CHANNEL_ID,
  GITHUB_WEBHOOK_SECRET,
  PORT = 3000
} = process.env;

// Type definitions for GitHub webhook payloads
interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  url: string;
}

interface GitHubReview {
  id: number;
  user: GitHubUser;
  body: string | null;
  state: 'approved' | 'changes_requested' | 'commented' | 'dismissed' | 'pending';
  submitted_at: string;
}

interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: 'open' | 'closed';
  user: GitHubUser;
  merged: boolean;
  merged_by?: GitHubUser;
  closed_by?: GitHubUser;
  requested_reviewer?: GitHubUser;
  review?: GitHubReview;
}

interface PullRequestEvent {
  action: string;
  pull_request: PullRequest;
  repository: {
    full_name: string;
  };
}

interface PRThreadInfo {
  threadId: string;
  prNumber: number;
}

// Discord bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// Express server for webhook
const app = express();
app.use(bodyParser.json());

// Store PR data (in memory for simplicity, use a database for production)
const prThreads: Map<number, PRThreadInfo> = new Map();

// Discord bot ready event
client.once('ready', () => {
  console.log(`Bot logged in as ${client.user?.tag}`);
});

// Verify GitHub webhook signature
function verifySignature(req: express.Request): boolean {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature || !GITHUB_WEBHOOK_SECRET) return false;
  
  const hmac = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

// Create a new thread for a PR
async function createPrThread(pr: PullRequest): Promise<ThreadChannel | null> {
  try {
    if (!DISCORD_CHANNEL_ID) {
      console.error('Missing DISCORD_CHANNEL_ID environment variable');
      return null;
    }

    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
    
    if (!channel || !(channel instanceof TextChannel)) {
      console.error('Invalid Discord channel');
      return null;
    }
    
    const thread = await channel.threads.create({
      name: `PR #${pr.number}: ${pr.title.substring(0, 90)}`, // Limit title length
      type: ChannelType.PublicThread,
      autoArchiveDuration: 60,
    });
    
    await thread.send({
      content: `**New PR opened by ${pr.user.login}**\n\n` +
               `**Title:** ${pr.title}\n` +
               `**Description:** ${pr.body || 'No description provided'}\n` +
               `**Link:** ${pr.html_url}\n\n` +
               `This thread will be updated as the PR status changes.`
    });
    
    prThreads.set(pr.id, {
      threadId: thread.id,
      prNumber: pr.number
    });
    
    console.log(`Created thread ${thread.id} for PR #${pr.number}`);
    return thread;
  } catch (error) {
    console.error(`Error creating thread for PR #${pr.number}:`, error);
    return null;
  }
}

// Update existing thread based on PR status
async function updatePrThread(pr: PullRequest, action: string): Promise<ThreadChannel | null> {
  const prData = prThreads.get(pr.id);
  if (!prData) {
    console.log(`No thread found for PR #${pr.number}, creating one...`);
    return await createPrThread(pr);
  }
  
  try {
    const thread = await client.channels.threads.fetch(prData.threadId);
    if (!thread) {
      console.error(`Thread ${prData.threadId} not found`);
      return null;
    }
    
    switch (action) {
      case 'closed':
        if (pr.merged) {
          await thread.send(`PR #${pr.number} was merged by ${pr.merged_by?.login || 'unknown'} 🎉`);
        } else {
          await thread.send(`PR #${pr.number} was closed without merging by ${pr.closed_by?.login || 'unknown'} ❌`);
        }
        await thread.setArchived(true);
        break;
        
      case 'reopened':
        await thread.setArchived(false);
        await thread.send(`PR #${pr.number} was reopened by ${pr.user.login} 🔄`);
        break;
        
      case 'synchronize':
        await thread.send(`PR #${pr.number} was updated with new commits 📝`);
        break;
        
      case 'review_requested':
        await thread.send(`Review requested for PR #${pr.number} from ${pr.requested_reviewer?.login || 'reviewers'} 👀`);
        break;
        
      case 'review_submitted':
        const review = pr.review;
        if (!review) {
          console.error('Review object is missing');
          return thread;
        }
        
        let message = `Review submitted by ${review.user.login}: `;
        
        switch (review.state) {
          case 'approved':
            message += '✅ Approved';
            break;
          case 'changes_requested':
            message += '🔄 Changes requested';
            break;
          case 'commented':
            message += '💬 Commented';
            break;
          default:
            message += review.state;
        }
        
        if (review.body) {
          message += `\n\n> ${review.body}`;
        }
        
        await thread.send(message);
        break;
    }
    
    console.log(`Updated thread for PR #${pr.number} with action: ${action}`);
    return thread;
  } catch (error) {
    console.error(`Error updating thread for PR #${pr.number}:`, error);
    return null;
  }
}

// Webhook endpoint for GitHub events
app.post('/webhook', async (req: express.Request, res: express.Response) => {
  // Verify webhook signature
  if (!verifySignature(req)) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = req.headers['x-github-event'] as string;
  const payload = req.body as PullRequestEvent;
  const action = payload.action;
  
  console.log(`Received ${event} event with action: ${action} for repo ${payload.repository?.full_name || 'unknown'}`);
  
  if (event === 'pull_request') {
    const pr = payload.pull_request;
    
    switch (action) {
      case 'opened':
        await createPrThread(pr);
        break;
      case 'closed':
      case 'reopened':
      case 'synchronize':
        await updatePrThread(pr, action);
        break;
    }
  } else if (event === 'pull_request_review') {
    const pr = payload.pull_request;
    const review = req.body.review as GitHubReview;
    
    const modifiedPr: PullRequest = {
      ...pr,
      review
    };
    await updatePrThread(modifiedPr, 'review_submitted');
  } else if (event === 'pull_request_review_request') {
    const pr = payload.pull_request;
    const requested_reviewer = req.body.requested_reviewer as GitHubUser;
    
    const modifiedPr: PullRequest = {
      ...pr,
      requested_reviewer
    };
    await updatePrThread(modifiedPr, 'review_requested');
  }
  
  res.status(200).send('Webhook received');
});

// Start the server and bot
if (!DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN environment variable');
  process.exit(1);
}

client.login(DISCORD_TOKEN);

app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
# GitHub PR Discord Bot

A TypeScript Discord bot that creates and manages threads based on GitHub Pull Request status.

## Features

- Creates Discord threads for new Pull Requests
- Updates threads based on PR activity:
  - New commits pushed
  - PR closed or merged (with thread archiving)
  - PR reopened (with thread unarchiving)
  - Reviews requested and submitted
- Secure webhook handling with signature verification
- Full TypeScript support with proper type definitions

## Prerequisites

- Node.js 16.x or higher
- pnpm
- A Discord bot token
- A GitHub App with webhook capabilities

## Project Structure

```
github-discord-bot/
├── src/
│   ├── discord-bot.ts             # Main bot code
│   ├── github-app-setup.ts  # Setup helper
│   └── types.ts             # TypeScript type definitions
├── dist/                    # Compiled JavaScript (generated)
├── .env                     # Environment variables (create from .env.example)
├── .env.example             # Template for environment variables
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
└── README.md                # Documentation
```

## Local Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit the `.env` file with your:
- Discord bot token
- Discord channel ID
- GitHub App credentials
- Webhook secret

### 3. Build the project

```bash
pnpm run build
```

### 4. Run the setup assistant

```bash
pnpm run setup
```

This will display instructions for setting up your GitHub App and Discord bot if you haven't already.

### 5. Start the bot

```bash
pnpm start
```

For development with automatic reloading:

```bash
pnpm run dev
```

## Setting Up the GitHub App

1. Go to GitHub > Settings > Developer settings > GitHub Apps > New GitHub App
2. Configure the app:
   - Set a name and homepage URL
   - Set the Webhook URL to your Railway project URL + `/webhook` (you'll get this URL after deployment)
   - Generate and set a webhook secret
3. Set these permissions:
   - Pull requests: Read & Write
   - Contents: Read-only
   - Metadata: Read-only
4. Subscribe to these events:
   - Pull request
   - Pull request review
   - Pull request review comment
5. Install the app on your repositories

## Setting Up the Discord Bot

1. Create a new application at https://discord.com/developers/applications
2. Add a bot and enable the necessary intents
3. Invite the bot to your server with these permissions:
   - Read Messages/View Channels
   - Send Messages
   - Create Public Threads
   - Send Messages in Threads
   - Manage Threads
4. Create a channel for PR updates and copy its ID

## Deployment to Railway

### Why Railway?

Railway is an excellent platform for deploying this bot because:
- It offers automatic HTTPS endpoints for your webhooks
- It has built-in environment variable management
- It integrates directly with GitHub repositories
- It provides free tier resources suitable for this bot
- It handles the infrastructure so you can focus on code

### Deployment Steps

1. **Create a Railway account**
   - Sign up at [railway.app](https://railway.app/) using your GitHub account

2. **Install Railway CLI (optional)**
   ```bash
   pnpm add -g @railway/cli
   railway login
   ```

3. **Deploy via Railway Dashboard (Recommended)**
   - Go to [railway.app dashboard](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your GitHub repository
   - Railway will automatically detect your Node.js project

4. **Configure Environment Variables**
   - In your Railway project, go to the "Variables" tab
   - Add the following variables:
     ```
     DISCORD_TOKEN=your_discord_bot_token
     DISCORD_CHANNEL_ID=your_discord_channel_id
     GITHUB_APP_ID=your_github_app_id
     GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
     ```
   - For the private key, you can:
     - Either add it directly as `GITHUB_PRIVATE_KEY` (replace newlines with `\n`)
     - Or use Railway's file storage feature to upload the private key

5. **Configure Build Settings**
   - In the "Settings" tab, make sure build command is:
     ```
     pnpm run build
     ```
   - And start command is:
     ```
     pnpm start
     ```

6. **Get Your Webhook URL**
   - After deployment, go to the "Settings" tab
   - Look for "Generated Domain" - this is your base URL
   - Your webhook URL will be: `https://your-generated-domain.railway.app/webhook`
   - Update your GitHub App's webhook URL with this value

7. **Monitor Your Deployment**
   - Check the "Deployments" tab to see deployment logs
   - Monitor the bot's operation in the "Logs" tab

### Maintaining Your Railway Deployment

- **Automatic Deployments**: Railway automatically redeploys when you push to your GitHub repository
- **Scaling**: If needed, you can adjust resources in the "Settings" tab
- **Monitoring**: Use the "Metrics" tab to monitor performance
- **Logs**: Check the "Logs" tab for troubleshooting


## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

MIT
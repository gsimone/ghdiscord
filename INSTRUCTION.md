Let's build a discord bot that can be used to create threads when a PR is opened.

It should work like this:

- when the PR is opened, the bot should create a thread in a specific channel, with a configurable name (via a js function)
- the bot should add a notification when the PR is updated - this can be turned on and off
- the bot should be able to modify the thread title based on the PR title changing or the draft state changing
- the bot should be able to add a comment to the PR with a link to the thread. Doing so will require a github app and token
- the bot should be able to CLOSE the thread when the PR is closed or merged


UX stories

- as a developer, I want to have a thread in a configured channel when a PR is opened
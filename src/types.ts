export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  url: string;
}

export interface GitHubReview {
  id: number;
  user: GitHubUser;
  body: string | null;
  state: 'approved' | 'changes_requested' | 'commented' | 'dismissed' | 'pending';
  submitted_at: string;
}

export interface PullRequest {
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

export interface PullRequestEvent {
  action: string;
  pull_request: PullRequest;
  repository: {
    full_name: string;
  };
}

export interface PRThreadInfo {
  threadId: string;
  prNumber: number;
}
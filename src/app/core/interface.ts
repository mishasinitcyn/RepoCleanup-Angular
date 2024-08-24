export interface IssueLabel {
    number: Number;
    label: string;
}

export const SpamLabel = {
    name: "spam",
  };

export interface User {
    avatar_url: string;
    name: string;
}

export interface FlaggedIssue {
    label: string; 
    number: Number; 
    username: string;
    state: string;
}
  
export interface RepoData {
    issues: any; 
    repoMetadata: any;
}

export const colorMapping: { [key: string]: string } = {
    'spam': 'red',
    'bug': 'orange',
    'feature': 'blue',
    'discussion': 'purple',
    'good-first-issue': 'teal',
    'suggestion': 'yellow'
  };
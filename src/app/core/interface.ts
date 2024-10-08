export interface IssueLabel {
    number: Number;
    label: string;
}

export const SpamLabel = {
    name: "spam",
    color: 'f5222d'
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
  repoMetadata: any;
  issues: any[];
  pagination: Pagination | any;
}

export interface Pagination {
  currentPage: number;
  perPage: number;
  totalPages: number;
  totalIssues: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

export const colorMapping: { [key: string]: string } = {
    'spam': 'red',
    'bug': 'orange',
    'feature': 'blue',
    'discussion': 'purple',
    'good-first-issue': 'teal',
    'suggestion': 'yellow'
  };
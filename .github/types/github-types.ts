// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import { GraphQLFunction } from "./project-v2-types";

/**
 * Represents a GitHub issue as returned by the GitHub REST API.
 */
export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  node_id: string;
}

/**
 * Minimal type definition for the GitHub client used in this project.
 */
export interface GitHubClient {
  rest: {
    issues: {
      createComment(params: {
        owner: string;
        repo: string;
        issue_number: number;
        body: string;
      }): Promise<unknown>;
      update(params: {
        owner: string;
        repo: string;
        issue_number: number;
        body?: string;
        state?: string;
      }): Promise<unknown>;
      listForRepo(params: {
        owner: string;
        repo: string;
        state: string;
      }): Promise<{ data: GitHubIssue[] }>;
    };
  };
  graphql: GraphQLFunction;
  paginate: (method: Function, params: object) => Promise<any[]>;
}

/**
 * Defines the structure of the original issue details extracted from GitHub.
 * This includes metadata about the issue and its repository.
 * This data is used to populate the incident template and for reference in comments.
 */
export interface OriginIssueDetails {
  repoName: string;
  number: number | null;
  url: string;
  author: string;
}

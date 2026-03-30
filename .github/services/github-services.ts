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
import { GitHubIssue, GitHubClient } from "../types/github-types";

/**
 * Posts a comment on a GitHub issue.
 */
export async function createIssueComment(
  github: GitHubClient,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string,
): Promise<void> {
  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
}

/**
 * Gets all open issues from a GitHub repository.
 * Automatically handles pagination to bypass the 30-item limit.
 */
export async function getAllOpenIssues(
  github: GitHubClient,
  owner: string,
  repo: string,
): Promise<GitHubIssue[]> {
  const response = await github.paginate(github.rest.issues.listForRepo, {
    owner,
    repo,
    state: "open",
    per_page: 100,
  });

  return response;
}

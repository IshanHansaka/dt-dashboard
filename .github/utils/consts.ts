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

// Matches a Google Doc Document ID from a URL
export const GOOGLE_DOC_URL_REGEX =
  /docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/;

// Matches the Incident Number from the security incident report header
// e.g. "Security Incident Report: INCIDENT-1234" 
export const INCIDENT_REPORT_HEADER_REGEX =
  /Security Incident Report:\s*(?:\*\*|__)?\s*([a-zA-Z0-9-]+)/i;

// Matches a strict YYYY-MM-DD date string anywhere in a larger string
export const DATE_EXTRACTION_REGEX = /(\d{4}-\d{2}-\d{2})/;

// Matches special Regex characters so they can be escaped safely
export const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

/**
 * Dynamically generates a regex to find a value in a Markdown table.
 * Looks for: | **fieldName** | value |
 */
export function buildMarkdownTableRegex(fieldName: string): RegExp {
  const safeFieldName = fieldName.replace(REGEX_SPECIAL_CHARS, "\\$&");
  return new RegExp(
    `\\|\\s*(?:\\*\\*|__)?${safeFieldName}(?:\\*\\*|__)?\\s*\\|([^|]+)\\|`,
    "i",
  );
}

// Matches the Description section in the GitHub Issue body
export const ISSUE_DESCRIPTION_REGEX =
  /### Description\s+([\s\S]*?)\s+## Security Incident Report/i;

// Matches: **Original Issue:** [org/repo#123](https://github.com/org/repo/issues/123)
export const ORIGIN_ISSUE_DETAILS_REGEX =
  /\*\*Original Issue:\*\*\s*\[([^#]+)#(\d+)\]\(([^)]+)\)/i;

// Matches: **Original Author:** [@username](https://github.com/username)
export const ORIGIN_AUTHOR_REGEX = /\*\*Original Author:\*\*\s*\[@([^\]]+)\]/i;

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
import fs from "fs";
import path from "path";
import { IncidentFieldData } from "../types/incident-field-types";
import { OriginIssueDetails } from "../types/github-types";

/**
 * Loads the incident issue template from the repository.
 */
export function loadTemplate(): string {
  const templatePath = path.join(
    process.env.GITHUB_WORKSPACE || ".",
    ".github/templates/issue-description.md",
  );

  try {
    return fs.readFileSync(templatePath, "utf8");
  } catch {
    throw new Error(`Failed to load issue template from: ${templatePath}`);
  }
}

/**
 * Builds the template replacement map from the issue metadata and incident data.
 */
export function buildTemplateData(
  description: string,
  issue: OriginIssueDetails,
  incidentData: IncidentFieldData,
  docUrl: string,
): Record<string, string> {
  return {
    "{{DESCRIPTION}}": description,
    "{{INCIDENT_NUMBER}}": incidentData.incidentNumber,
    "{{REPO_NAME}}": issue.repoName,
    "{{ISSUE_NUMBER}}": issue.number ? issue.number.toString() : "N/A",
    "{{ISSUE_URL}}": issue.url,
    "{{AUTHOR}}": issue.author || "Unknown",
    "{{GOOGLE_DOC_URL}}": docUrl,
  };
}

/**
 * Replaces template placeholders in the issue body with actual values.
 */
export function applyTemplateReplacements(
  template: string,
  templateData: Record<string, string>,
): string {
  let result = template;
  for (const [placeholder, value] of Object.entries(templateData)) {
    result = result.split(placeholder).join(value || "");
  }
  return result;
}

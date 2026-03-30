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
import { IncidentFieldData } from "../types/incident-field-types";
import {
  INCIDENT_REPORT_HEADER_REGEX,
  buildMarkdownTableRegex,
} from "./consts";
import { GOOGLE_DOC_FIELD_NAMES } from "./field-mappings";

/**
 * Extracts the Incident Number from the Markdown header.
 */
export function extractIncidentNumber(markdown: string): string {
  const match = markdown.match(INCIDENT_REPORT_HEADER_REGEX);

  if (match && match[1]) {
    return match[1].trim();
  }

  // Safe fallback if the user deleted the header in the Google Doc
  return "Not Found";
}

/**
 * Extracts field values from a markdown table exported from Google Docs.
 * Searches for a table row matching the field name and returns the value in the adjacent column.
 * Normalizes placeholder values (SELECT, N/A, empty strings) to "Not Specified".
 */
export function extractMarkdownTableField(
  markdown: string,
  fieldName: string,
): string {
  if (!markdown || !fieldName) return "";

  // Matches markdown table format: | **Field Name** | value |
  const regex = buildMarkdownTableRegex(fieldName);
  const match = markdown.match(regex);
  if (match && match[1]) {
    const value = match[1].trim();
    if (
      value === "SELECT" ||
      value === "Select the Unauthorized Activity Type" ||
      value === "" ||
      value === "N/A" ||
      value === "Person"
    ) {
      return "Not Specified";
    }
    return value;
  }
  return "Not Found";
}

/**
 * Extracts all incident field data from Google Doc markdown content.
 * Uses the centralised field configuration to ensure consistency.
 */
export function extractDocDetails(markdownText: string): IncidentFieldData {
  return {
    incidentNumber: extractIncidentNumber(markdownText),
    incidentType: extractMarkdownTableField(
      markdownText,
      GOOGLE_DOC_FIELD_NAMES.incidentType,
    ),
    incidentClassification: extractMarkdownTableField(
      markdownText,
      GOOGLE_DOC_FIELD_NAMES.incidentClassification,
    ),
    openedDate: extractMarkdownTableField(
      markdownText,
      GOOGLE_DOC_FIELD_NAMES.openedDate,
    ),
    closedDate: extractMarkdownTableField(
      markdownText,
      GOOGLE_DOC_FIELD_NAMES.closedDate,
    ),
    reportedBy: extractMarkdownTableField(
      markdownText,
      GOOGLE_DOC_FIELD_NAMES.reportedBy,
    ),
    priority: extractMarkdownTableField(
      markdownText,
      GOOGLE_DOC_FIELD_NAMES.priority,
    ),
    assignmentTo: extractMarkdownTableField(
      markdownText,
      GOOGLE_DOC_FIELD_NAMES.assignmentTo,
    ),
    assignmentGroup: extractMarkdownTableField(
      markdownText,
      GOOGLE_DOC_FIELD_NAMES.assignmentGroup,
    ),
    affectedSystem: extractMarkdownTableField(
      markdownText,
      GOOGLE_DOC_FIELD_NAMES.affectedSystem,
    ),
    attachmentOptions: extractMarkdownTableField(
      markdownText,
      GOOGLE_DOC_FIELD_NAMES.attachmentOptions,
    ),
  };
}

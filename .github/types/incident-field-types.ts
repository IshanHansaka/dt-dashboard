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

/**
 * Defines the structure of incident field data used in the application.
 * This data structure is populated from both Google Doc content and GitHub issue bodies.
 */
export interface IncidentFieldData {
  incidentNumber: string;
  incidentType: string;
  incidentClassification: string;
  openedDate: string;
  closedDate: string;
  reportedBy: string;
  priority: string;
  assignmentTo: string;
  assignmentGroup: string;
  affectedSystem: string;
  attachmentOptions: string;
}

/**
 * Enum for project field types used in GitHub Projects.
 * This helps in determining how to format field values when syncing with GitHub.
 */
export enum ProjectFieldType {
  TEXT = "text",
  SINGLE_SELECT = "single-select",
  DATE = "date",
}

/**
 * Defines the mapping between GitHub Project field names and IncidentFieldData keys.
 * This is used to ensure consistent data extraction and formatting when syncing with GitHub Projects.
 */
export interface ProjectFieldMapping {
  //The name of the custom field in GitHub Project Board
  projectFieldName: string;
  // The key in IncidentFieldData that holds the value
  dataKey: keyof IncidentFieldData;
  // The type of the field
  fieldType: ProjectFieldType;
}

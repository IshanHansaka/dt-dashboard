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
import {
  IncidentFieldData,
  ProjectFieldMapping,
  ProjectFieldType,
} from "../types/incident-field-types";

/**
 * Field Mappings Configuration
 * Defines the mapping between Google Doc fields and GitHub Project V2 fields.
 * Master configuration for all field mappings.
 */
export const PROJECT_FIELD_MAPPINGS: ProjectFieldMapping[] = [
  {
    projectFieldName: "Incident #",
    dataKey: "incidentNumber",
    fieldType: ProjectFieldType.TEXT,
  },
  {
    projectFieldName: "Incident Type",
    dataKey: "incidentType",
    fieldType: ProjectFieldType.SINGLE_SELECT,
  },
  {
    projectFieldName: "Incident Classification",
    dataKey: "incidentClassification",
    fieldType: ProjectFieldType.SINGLE_SELECT,
  },
  {
    projectFieldName: "Opened Date",
    dataKey: "openedDate",
    fieldType: ProjectFieldType.DATE,
  },
  {
    projectFieldName: "Closed Date",
    dataKey: "closedDate",
    fieldType: ProjectFieldType.DATE,
  },
  {
    projectFieldName: "Reported By",
    dataKey: "reportedBy",
    fieldType: ProjectFieldType.TEXT,
  },
  {
    projectFieldName: "Category/Rating/Priority",
    dataKey: "priority",
    fieldType: ProjectFieldType.SINGLE_SELECT,
  },
  {
    projectFieldName: "Assignment To",
    dataKey: "assignmentTo",
    fieldType: ProjectFieldType.TEXT,
  },
  {
    projectFieldName: "Assignment Group/Team",
    dataKey: "assignmentGroup",
    fieldType: ProjectFieldType.SINGLE_SELECT,
  },
  {
    projectFieldName: "Service/Product/Scope/system/Tool",
    dataKey: "affectedSystem",
    fieldType: ProjectFieldType.TEXT,
  },
  {
    projectFieldName: "Attachment options for incident report",
    dataKey: "attachmentOptions",
    fieldType: ProjectFieldType.TEXT,
  },
];

/**
 * Maps Google Doc field names to data extraction keys.
 * Used for parsing markdown content from Google Docs.
 */
export const GOOGLE_DOC_FIELD_NAMES: Record<
  keyof Omit<IncidentFieldData, "incidentNumber">,
  string
> = {
  incidentType: "Incident type",
  incidentClassification: "Incident classification",
  openedDate: "Incident reported on",
  closedDate: "Incident closed on",
  reportedBy: "Reporter",
  priority: "Priority",
  assignmentTo: "Coordinator",
  assignmentGroup: "Incident owning team (Custodian)",
  affectedSystem: "Affected system(s)",
  attachmentOptions: "Incident report located at",
};

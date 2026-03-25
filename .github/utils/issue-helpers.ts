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
  updateProjectDateField,
  updateProjectSingleSelectField,
  updateProjectTextField,
} from "../services/project-v2-services";
import { PROJECT_FIELD_MAPPINGS } from "./field-mappings";
import { formatDateForGitHub } from "./dates";
import { GraphQLFunction, ProjectV2FieldNode } from "../types/project-v2-types";
import {
  IncidentFieldData,
  ProjectFieldType,
} from "../types/incident-field-types";

/**
 * Compares old and new incident data, updates only changed project fields,
 * and returns a log of what changed.
 */
export async function diffAndUpdateProjectFields(
  graphql: GraphQLFunction,
  projectId: string,
  itemId: string,
  fields: ProjectV2FieldNode[],
  oldData: IncidentFieldData,
  newData: IncidentFieldData,
): Promise<string[]> {
  const fieldsByName = new Map(fields.map((f) => [f.name, f]));

  const updatePromises: Promise<void>[] = [];
  const changedFieldsLog: string[] = [];

  for (const mapping of PROJECT_FIELD_MAPPINGS) {
    const oldValue = oldData[mapping.dataKey] || "Not Specified";
    let newValue = newData[mapping.dataKey] || "Not Specified";

    // Format dates to GitHub's expected format for comparison and updating
    if (mapping.fieldType === ProjectFieldType.DATE) {
      newValue = formatDateForGitHub(newValue) || "Not Specified";
    }

    if (oldValue === newValue) continue;

    changedFieldsLog.push(
      `- **${mapping.projectFieldName}**: \`${oldValue || "None"}\` -> \`${newValue || "None"}\``,
    );

    const field = fieldsByName.get(mapping.projectFieldName);
    const fieldId = field?.id;

    switch (mapping.fieldType) {
      case ProjectFieldType.TEXT:
        updatePromises.push(
          updateProjectTextField(
            graphql,
            projectId,
            itemId,
            fieldId,
            newValue,
            mapping.projectFieldName,
          ),
        );
        break;
      case ProjectFieldType.SINGLE_SELECT:
        updatePromises.push(
          updateProjectSingleSelectField(
            graphql,
            projectId,
            itemId,
            field,
            newValue,
            mapping.projectFieldName,
          ),
        );
        break;
      case ProjectFieldType.DATE:
        updatePromises.push(
          updateProjectDateField(
            graphql,
            projectId,
            itemId,
            fieldId,
            formatDateForGitHub(newValue),
            mapping.projectFieldName,
          ),
        );
        break;
    }
  }

  await Promise.all(updatePromises);

  return changedFieldsLog;
}

/**
 * Validates required environment variables are present.
 */
export function validateEnv(requiredVars: Record<string, string>): void {
  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

/**
 * Converts raw GitHub Project field values into a standardized IncidentFieldData object.
 * Maps the visual project column names back to our internal data keys.
 */
export function extractProjectDetails(
  projectFieldValues: Record<string, string>,
): IncidentFieldData {
  const oldIncidentDetails: Partial<IncidentFieldData> = {};

  for (const mapping of PROJECT_FIELD_MAPPINGS) {
    // Safely map the value, defaulting to "Not Specified" if it is empty
    oldIncidentDetails[mapping.dataKey] =
      projectFieldValues[mapping.projectFieldName] || "Not Specified";
  }

  return oldIncidentDetails as IncidentFieldData;
}

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
  GraphQLFunction,
  ProjectV2Data,
  ProjectV2ItemResponse,
  UpdateFieldResponse,
  ProjectV2FieldNode,
  GraphQLProjectItemResponse,
} from "../types/project-v2-types";

/**
 * Retrieves project metadata including field definitions for a GitHub Projects V2 board.
 * Field IDs are required to update custom field values on project items.
 * For single-select fields, also fetches the available options and their IDs.
 */
export async function getProjectData(
  graphql: GraphQLFunction,
  targetOwner: string,
  projectNumber: number,
): Promise<ProjectV2Data> {
  const query = `
    query($login: String!, $number: Int!) {
      organization(login: $login) {
        projectV2(number: $number) {
          id
          fields(first: 50) {
            nodes {
              ... on ProjectV2Field { id name dataType }
              ... on ProjectV2SingleSelectField {
                id
                name
                dataType
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  const result = await graphql<{ organization: { projectV2: ProjectV2Data } }>(
    query,
    {
      login: targetOwner,
      number: projectNumber,
    },
  );
  return result.organization.projectV2;
}

/**
 * Adds a GitHub issue to a Projects V2 board.
 * Returns the project item ID which is needed for subsequent field updates.
 */
export async function assignIssueToProject(
  graphql: GraphQLFunction,
  projectId: string,
  newIssueNodeId: string,
): Promise<string> {
  const mutation = `
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
        item { id }
      }
    }
  `;
  const result = await graphql<ProjectV2ItemResponse>(mutation, {
    projectId,
    contentId: newIssueNodeId,
  });
  return result.addProjectV2ItemById.item.id;
}

/**
 * Reads the current field values for a Projects V2 item and returns a
 * simple map of field name -> value. Supports text, single-select, and date.
 */
export async function getProjectItemFieldValues(
  graphql: GraphQLFunction,
  itemId: string,
): Promise<Record<string, string>> {
  const query = `
    query($itemId: ID!) {
      node(id: $itemId) {
        ... on ProjectV2Item {
          id
          fieldValues(first: 50) {
            nodes {
              ... on ProjectV2ItemFieldTextValue {
                field {
                  ... on ProjectV2Field { name }
                  ... on ProjectV2SingleSelectField { name }
                  ... on ProjectV2IterationField { name }
                }
                text
              }
              ... on ProjectV2ItemFieldSingleSelectValue {
                field {
                  ... on ProjectV2Field { name }
                  ... on ProjectV2SingleSelectField { name }
                  ... on ProjectV2IterationField { name }
                }
                name
              }
              ... on ProjectV2ItemFieldDateValue {
                field {
                  ... on ProjectV2Field { name }
                  ... on ProjectV2SingleSelectField { name }
                  ... on ProjectV2IterationField { name }
                }
                date
              }
            }
          }
        }
      }
    }
  `;

  const result = await graphql<GraphQLProjectItemResponse>(query, { itemId });
  const nodes = result?.node?.fieldValues?.nodes || [];

  return nodes.reduce(
    (map, node) => {
      const fieldName = node?.field?.name;
      if (fieldName) {
        // Natively falls back to whichever value exists
        map[fieldName] = node.text ?? node.name ?? node.date ?? "";
      }
      return map;
    },
    {} as Record<string, string>,
  );
}

/**
 * Updates a text-type custom field on a GitHub Projects V2 item.
 */
export async function updateProjectTextField(
  graphql: GraphQLFunction,
  projectId: string,
  itemId: string,
  fieldId: string | undefined,
  value: string | null,
  fieldName?: string,
): Promise<void> {
  if (!fieldId) return;

  try {
    const mutation = `
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId,
          itemId: $itemId,
          fieldId: $fieldId,
          value: { text: $value }
        }) { projectV2Item { id } }
      }
    `;

    let finalValue = value;

    if (!value || value === "Not Found" || value === "Not Specified")
      finalValue = "";

    await graphql<UpdateFieldResponse>(mutation, {
      projectId,
      itemId,
      fieldId,
      value: finalValue,
    });

    console.log(`   Set ${fieldName}: [value set]`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`   Failed to set ${fieldName}: ${errorMessage}`);
    throw error;
  }
}

/**
 * Updates a single-select custom field on a GitHub Projects V2 item.
 * If the provided value is missing or a placeholder, it normalises the value
 * to "Not Specified" and applies that option if it exists on the board.
 */
export async function updateProjectSingleSelectField(
  graphql: GraphQLFunction,
  projectId: string,
  itemId: string,
  field: ProjectV2FieldNode | undefined,
  value: string | null,
  fieldName?: string,
): Promise<void> {
  if (!field || !field.id) {
    console.log(
      `   Skipping ${fieldName || "single-select field"}: field not found`,
    );
    return;
  }

  let finalValue = value || "Not Specified";

  if (
    !value ||
    value.trim() === "" ||
    value === "Not Found" ||
    value === "SELECT" ||
    value === "Select the Unauthorized Activity Type"
  ) {
    finalValue = "Not Specified";
  }

  // Find the matching option by name (case-insensitive)
  const matchingOption = field.options?.find(
    (opt) => opt.name.toLowerCase() === finalValue.toLowerCase(),
  );

  if (!matchingOption) {
    console.warn(
      `   Warning: "${finalValue}" does not match any option for ${fieldName || field.name}.`,
    );
    return;
  }

  try {
    const mutation = `
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId,
          itemId: $itemId,
          fieldId: $fieldId,
          value: { singleSelectOptionId: $optionId }
        }) { projectV2Item { id } }
      }
    `;

    await graphql<UpdateFieldResponse>(mutation, {
      projectId,
      itemId,
      fieldId: field.id,
      optionId: matchingOption.id,
    });

    console.log(`   Set ${fieldName || field.name}: [value set]`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `   Failed to set ${fieldName || field.name}: ${errorMessage}`,
    );
    throw error;
  }
}

/**
 * Updates a date-type custom field on a GitHub Projects V2 item.
 * Automatically clears the field entirely if the value is missing or null.
 */
export async function updateProjectDateField(
  graphql: GraphQLFunction,
  projectId: string,
  itemId: string,
  fieldId: string | undefined,
  value: string | null,
  fieldName?: string,
): Promise<void> {
  if (!fieldId) return;
  if (!value || value === "Not Found" || value === "Not Specified") {
    value = null;
  }

  try {
    if (value) {
      const updateMutation = `
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: Date!) {
          updateProjectV2ItemFieldValue(input: {
            projectId: $projectId,
            itemId: $itemId,
            fieldId: $fieldId,
            value: { date: $value }
          }) { projectV2Item { id } }
        }
      `;
      await graphql(updateMutation, { projectId, itemId, fieldId, value });
      console.log(`   Set ${fieldName || "date"}: [value set]`);
    } else {
      const clearMutation = `
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!) {
          clearProjectV2ItemFieldValue(input: {
            projectId: $projectId,
            itemId: $itemId,
            fieldId: $fieldId
          }) { projectV2Item { id } }
        }
      `;
      await graphql(clearMutation, { projectId, itemId, fieldId });
      console.log(`   Cleared ${fieldName || "date"} (value was empty)`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `   Failed to set ${fieldName || "date field"}: ${errorMessage}`,
    );
    throw error;
  }
}

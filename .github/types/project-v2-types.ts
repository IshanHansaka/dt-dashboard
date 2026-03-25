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

export interface ProjectV2SingleSelectOption {
  id: string;
  name: string;
}

export interface ProjectV2FieldNode {
  id: string;
  name: string;
  dataType: string;
  options?: ProjectV2SingleSelectOption[];
}

export interface ProjectV2Data {
  id: string;
  fields: {
    nodes: ProjectV2FieldNode[];
  };
}

export interface ProjectV2ItemResponse {
  addProjectV2ItemById: {
    item: {
      id: string;
    };
  };
}

export interface UpdateFieldResponse {
  updateProjectV2ItemFieldValue: {
    projectV2Item: {
      id: string;
    };
  };
}

/**
 * Type definition for GraphQL function signature
 */
export type GraphQLFunction = <T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
) => Promise<T>;

/**
 * Type definition for parsing project item field values from GraphQL responses.
 */
interface ProjectFieldValueNode {
  field?: { name?: string };
  text?: string; // For text fields
  name?: string; // For Single Select
  date?: string; // For Dates
}

export interface GraphQLProjectItemResponse {
  node?: {
    fieldValues?: {
      nodes?: ProjectFieldValueNode[];
    };
  };
}

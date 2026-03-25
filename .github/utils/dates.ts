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
import { DATE_EXTRACTION_REGEX } from "./consts";

/**
 * Formats date strings to strict YYYY-MM-DD format required by GitHub Projects API.
 * Validates the date is real (e.g., rejects Feb 30) to prevent API errors.
 */
export function formatDateForGitHub(dateString: string): string | null {
  if (
    !dateString ||
    dateString === "Not Found" ||
    dateString === "Not Specified"
  )
    return null;

  // Extracts the first YYYY-MM-DD sequence it finds
  const match = dateString.match(DATE_EXTRACTION_REGEX);
  if (!match) return null;

  const dateStr = match[1];
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  return dateStr;
}

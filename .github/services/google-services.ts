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
import { DriveClient } from "../types/google-drive-types";

/**
 * Exports a Google Doc as Markdown using an authenticated Drive client.
 */
export async function fetchGoogleDocContent(
  docId: string,
  drive: DriveClient,
): Promise<string> {
  try {
    const response = await drive.files.export({
      fileId: docId,
      mimeType: "text/markdown",
    });

    console.log("   Google doc content fetched.");
    return response.data;
  } catch (error: unknown) {
    console.error(`Google Error Details:`);
    if (error && typeof error === "object" && "response" in error) {
      const errorWithResponse = error as {
        response: { status: number; data: unknown };
      };
      console.error(`   Status: ${errorWithResponse.response.status}`);
      console.error(
        `   Data: ${JSON.stringify(errorWithResponse.response.data)}`,
      );
    } else {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`   Message: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Checks if a Google Doc has been modified within a specified time window.
 *
 * Retrieves the last modified timestamp from Google Drive API and compares it
 * against the specified time threshold.
 */
export async function wasDocUpdatedRecently(
  docId: string,
  drive: DriveClient,
  hours: number,
): Promise<boolean> {
  try {
    const response = await drive.files.get({
      fileId: docId,
      fields: "modifiedTime",
    });
    const modifiedTime = new Date(response.data.modifiedTime);
    const timeLimit = new Date(Date.now() - hours * 60 * 60 * 1000);
    return modifiedTime > timeLimit;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(
      `   Could not check modified time for Doc ${docId}: ${errorMessage}`,
    );
    return false;
  }
}

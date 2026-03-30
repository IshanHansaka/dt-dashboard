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
  fetchGoogleDocContent,
  wasDocUpdatedRecently,
} from "../services/google-services";
import {
  getAllOpenIssues,
  createIssueComment,
  updateIssueBody,
} from "../services/github-services";
import {
  assignIssueToProject,
  getProjectData,
  getProjectItemFieldValues,
} from "../services/project-v2-services";
import {
  loadTemplate,
  applyTemplateReplacements,
  buildTemplateData,
} from "../services/template-services";
import {
  extractOriginDescription,
  extractOriginIssueDetails,
  extractDocDetails,
} from "../utils/parsers";
import { GOOGLE_DOC_URL_REGEX } from "../utils/consts";
import {
  diffAndUpdateProjectFields,
  extractProjectDetails,
  validateEnv,
} from "../utils/issue-helpers";

/**
 * Daily Google Doc Sync
 *
 * This script runs on a daily schedule to keep mirrored issues in sync with
 * their linked Google Docs. For each open issue in the centralised repo:
 * 1. Gets all open issues and checks for a linked Google Doc URL in the body
 * 2. Checks if the linked Google Doc was modified in the last 24 hours
 * 3. Extracts updated incident fields from the Google Doc
 * 4. Compares against existing issue data and updates only changed fields
 * 5. Syncs changed fields to the GitHub Project V2 board
 * 6. Updates the issue body and posts a change summary comment
 */
module.exports = async ({
  context,
  core,
  google,
  github,
}: any): Promise<void> => {
  try {
    core.info("Starting Daily Google Doc Sync...");

    // Validate environment variables
    const config = {
      PROJECT_NUMBER: (process.env.PROJECT_NUMBER || "").trim(),
      GCP_CLIENT_ID: (process.env.GCP_CLIENT_ID || "").trim(),
      GCP_CLIENT_SECRET: (process.env.GCP_CLIENT_SECRET || "").trim(),
      GCP_REFRESH_TOKEN: (process.env.GCP_REFRESH_TOKEN || "").trim(),
    };

    validateEnv(config);

    const projectNumber = parseInt(config.PROJECT_NUMBER, 10);
    if (isNaN(projectNumber)) {
      throw new Error(
        `PROJECT_NUMBER must be a valid integer: "${config.PROJECT_NUMBER}"`,
      );
    }

    const targetOwner = context.repo.owner;
    const targetRepo = context.repo.repo;

    // Initialize Google Drive API client with OAuth2 credentials
    const auth = new google.auth.OAuth2(
      config.GCP_CLIENT_ID,
      config.GCP_CLIENT_SECRET,
    );
    auth.setCredentials({ refresh_token: config.GCP_REFRESH_TOKEN });
    const googleDrive = google.drive({ version: "v3", auth });

    core.info(`Fetching all open issues in ${targetOwner}/${targetRepo}...`);

    const openIssues = await getAllOpenIssues(
      github,
      targetOwner,
      targetRepo,
    );

    core.info(
      `Found ${openIssues.length} open issues. Checking for linked Google Docs and updates...`,
    );

    // Fetch project metadata
    const projectData = await getProjectData(
      github.graphql,
      targetOwner,
      projectNumber,
    );

    for (const issue of openIssues) {
      core.startGroup(`Checking Issue #${issue.number} ("${issue.title}")`);
      try {
        // Extract Google Doc ID from the issue body using regex
        const match = issue.body?.match(GOOGLE_DOC_URL_REGEX);

        if (!match || !match[1]) {
          core.warning(`   No Google Doc link found in body. Skipping.`);
          continue;
        }

        const docId = match[1];
        const docUrl = `https://docs.google.com/document/d/${docId}`;

        // Check if the document was modified in the last 24 hours
        const isUpdated = await wasDocUpdatedRecently(docId, googleDrive, 24);

        if (!isUpdated) {
          core.info(
            `Google Doc has NOT been modified in the last 24 hours. Skipping.`,
          );
          continue;
        }

        core.notice(
          `Google Doc WAS modified! Fetching new content and syncing...`,
        );

        const markdownText = await fetchGoogleDocContent(docId, googleDrive);
        const newIncidentDetails = extractDocDetails(markdownText);

        // Ensure issue is on the project board before updating fields
        const itemId = await assignIssueToProject(
          github.graphql,
          projectData.id,
          issue.node_id,
        );

        const projectFieldValues = await getProjectItemFieldValues(
          github.graphql,
          itemId,
        );
        const oldIncidentDetails = extractProjectDetails(projectFieldValues);
        core.info(`   Extracted old incident details from Project Board.`);

        // Compare old vs new data, only update changed fields
        const changedFieldsLog = await diffAndUpdateProjectFields(
          github.graphql,
          projectData.id,
          itemId,
          projectData.fields.nodes,
          oldIncidentDetails,
          newIncidentDetails,
        );

        if (changedFieldsLog.length === 0) {
          core.info(
            `   Data parsed, but no tracked fields actually changed. Skipping API updates.`,
          );
          continue;
        }

        core.info(
          `   Updated ${changedFieldsLog.length} fields on project board.`,
        );

        // Rebuild issue body from template with updated incident data
        const oldBody = issue.body || "";
        const template = loadTemplate();
        const replacements = buildTemplateData(
          extractOriginDescription(oldBody),
          extractOriginIssueDetails(oldBody),
          newIncidentDetails,
          docUrl,
        );

        const mirroredIssueBody = applyTemplateReplacements(
          template,
          replacements,
        );

        await updateIssueBody(
          github,
          targetOwner,
          targetRepo,
          issue.number,
          mirroredIssueBody,
        );

        const commentBody =
          `**Auto-Sync:** Incident details have been updated.\n\n` +
          `### Changes Detected:\n${changedFieldsLog.join("\n")}`;

        await createIssueComment(
          github,
          targetOwner,
          targetRepo,
          issue.number,
          commentBody,
        );

        core.info(
          `   Successfully synced updates to Issue #${issue.number} and Project Board.`,
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        core.error(
          `   Failed to process Issue #${issue.number}: ${errorMessage}`,
        );
      } finally {
        core.endGroup();
      }
    }

    core.notice("Daily Sync Complete!");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Daily Sync Failed: ${errorMessage}`);

    if (error instanceof Error && error.stack) {
      core.error(error.stack);
    }
  }
};

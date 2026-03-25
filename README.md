# Security Incident Sync

A robust automation system that synchronizes security incident data between Google Docs, GitHub Issues, and GitHub Projects boards. This system automatically polls Google Docs for updates and maintains centralized incident tracking across your organization.

## Overview

This project implements a daily synchronization workflow that:

- **Polls** Google Docs linked to active GitHub issues for recent updates
- **Extracts** structured incident data from markdown-formatted Google Docs
- **Syncs** changes to GitHub Projects V2 board custom fields
- **Updates** GitHub issue bodies with the latest incident details
- **Logs** all changes with detailed audit comments

## Features

- **Automated Polling**: Runs daily at 18:30 UTC (configurable schedule)
- **Smart Updates**: Only processes documents modified in the last 24 hours
- **Parallel Processing**: Optimized API calls for maximum performance
- **Field Validation**: Type-safe date parsing and single-select option matching
- **Comprehensive Logging**: Detailed change tracking with before/after values
- **Error Handling**: Graceful degradation and detailed error messages
- **Manual Trigger**: Can be invoked manually via GitHub Actions UI

## Architecture

```
.github/
├── workflows/
│   └── daily-doc-sync.yml          # GitHub Actions workflow definition
├── scripts/
│   └── daily-doc-sync.ts           # Main orchestration logic
├── services/
│   ├── github-services.ts           # GitHub REST API (issues, comments)
│   ├── google-services.ts          # Google Drive/Docs API integration
│   ├── project-v2-services.ts      # GitHub Projects V2 GraphQL API
│   └── template-services.ts        # Issue template loading & substitution
├── utils/
│   ├── consts.ts                   # Regex patterns and constants
│   ├── dates.ts                    # Date formatting and validation
│   ├── field-mappings.ts           # Field mapping configuration
│   ├── issue-helpers.ts            # Incident data extraction & diffing
│   └── parsers.ts                  # Markdown and data extraction utilities
├── types/
│   ├── incident-field-types.ts     # Incident field data & field mapping types
│   ├── issue-data-types.ts         # GitHub issue type definitions
│   └── project-v2-types.ts         # Projects V2 GraphQL type definitions
└── templates/
    └── issue-description.md        # Issue body template with placeholders
```

## Getting Started

### Required Secrets

Configure the following secrets in your GitHub repository settings:

| Secret Name                  | Description                                     |
| ---------------------------- | ----------------------------------------------- |
| `GCP_CLIENT_ID`              | Google Cloud OAuth2 Client ID                   |
| `GCP_CLIENT_SECRET`          | Google Cloud OAuth2 Client Secret               |
| `GCP_REFRESH_TOKEN`          | Google OAuth2 Refresh Token (for server access) |
| `ISSUE_PROJECT_ACCESS_TOKEN` | GitHub PAT with `project` and `repo` scopes     |
| `PROJECT_NUMBER`             | GitHub Project number                           |

### Setup Instructions

1. **Clone this repository**

   ```bash
   git clone <repository-url>
   cd dt-dashboard
   ```

2. **Configure GitHub Secrets**
   - Navigate to repository Settings → Secrets and variables → Actions
   - Add all required secrets listed above

3. **Test the workflow**
   - Go to Actions tab → "Sync Active Incidents"
   - Click "Run workflow" to trigger manually

## Usage

### Sync Behavior

- **Daily automatic sync** runs at 18:30 UTC
- **Only processes** documents modified in the last 24 hours
- **Skips updates** if no tracked fields have changed
- **Posts a comment** on the issue listing all detected changes
- **Updates** the issue body and project board fields in parallel

## 🔧 Configuration

### Modifying the Schedule

Edit [.github/workflows/daily-doc-sync.yml](.github/workflows/daily-doc-sync.yml#L10):

```yaml
on:
  schedule:
    - cron: "30 18 * * *" # Change this to your preferred time
```

### Adjusting the Update Window

Modify the polling window in [.github/scripts/daily-doc-sync.ts](.github/scripts/daily-doc-sync.ts#L137):

```typescript
const isUpdated = await wasDocUpdatedRecently(docId, drive, 24); // Change 24 to desired hours
```

### Adding New Fields

1. Add extraction logic in [.github/utils/parsers.ts](.github/utils/parsers.ts)
2. Add the field to the extraction in [.github/scripts/daily-doc-sync.ts](.github/scripts/daily-doc-sync.ts#L147-L165)
3. Add comparison and update logic after line 200
4. Update the template in [.github/templates/issue-description.md](.github/templates/issue-description.md)

## Project Fields

The system syncs the following fields to GitHub Projects:

| Field Name                        | Type          | Source in Google Doc               |
| --------------------------------- | ------------- | ---------------------------------- |
| Incident #                        | Text          | Document header                    |
| Incident Type                     | Single Select | "Incident type"                    |
| Incident Classification           | Single Select | "Incident Classification"          |
| Opened Date                       | Date          | "Incident reported on"             |
| Closed Date                       | Date          | "Incident closed on"               |
| Reported By                       | Text          | "Reporter"                         |
| Description                       | Text          | "Incident Overview"                |
| Category/Rating/Priority          | Single Select | "Priority"                         |
| Assignment To                     | Text          | "Coordinator"                      |
| Assignment Group/Team             | Single Select | "Incident owning team (Custodian)" |
| Service/Product/Scope/system/Tool | Text          | "Affected system(s)"               |
| Attachment options                | Text          | "Incident report located at"       |

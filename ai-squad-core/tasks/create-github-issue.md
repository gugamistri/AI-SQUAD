# Create GitHub Issue Task

## Purpose

Automatically create GitHub issues from AI-SQUAD stories, epics, and tasks with proper mapping to GitHub Projects. This task handles the conversion of AI-SQUAD story format to GitHub issue format while preserving all relevant information and maintaining project organization.

## Task Instructions

### 1. Validate GitHub Configuration

[[LLM: Check if GitHub integration is properly set up before proceeding]]

Verify GitHub setup:

- Check `github.enabled` is true in core-config.yaml
- Validate API token and repository configuration
- Test GitHub API connectivity and permissions
- Verify project access and write permissions

If configuration is invalid:

```
GitHub integration not configured or invalid.
Use *setup-github command to configure GitHub integration.
```

### 2. Parse Story/Epic Input

[[LLM: Understand what type of content needs to be converted to GitHub issue]]

Identify input type and parse accordingly:

**For Story Files** (from docs/stories/):

- Extract story metadata (title, description, acceptance criteria)
- Parse task list and subtasks
- Identify story type (user-story, bug-fix, technical-task)
- Extract assignee and priority information
- Get epic/milestone association

**For Epic Files** (from docs/prd/):

- Extract epic title and description
- Parse epic scope and objectives
- Identify constituent stories
- Extract timeline and dependencies

**For Manual Input**:

- Title (required)
- Description (required)
- Issue type (user-story, epic, task, bug)
- Priority level
- Assignee (optional)
- Labels (optional)

### 3. Determine Issue Type and Labels

[[LLM: Map AI-SQUAD content to appropriate GitHub issue configuration]]

Based on `issueMapping` configuration, determine:

**Issue Type**:

- Story → "user-story" label
- Epic → "epic" label
- Task → "task" label
- Bug → "bug" label

**Priority Labels**:

- High → "priority-high"
- Medium → "priority-medium"
- Low → "priority-low"

**Status Labels**:

- Draft → "status-draft"
- Ready → "status-ready"
- Blocked → "status-blocked"

### 4. Format Issue Content

[[LLM: Convert AI-SQUAD format to GitHub issue format while preserving information]]

Create GitHub issue content:

#### Issue Title

Use story title directly, with prefix if configured:

```
[STORY-001] User Login Authentication
[EPIC-002] Payment System Integration
[TASK-003] Database Migration Script
```

#### Issue Body Template

```markdown
## Description

{{story-description}}

## Acceptance Criteria

{{acceptance-criteria-list}}

## Tasks

{{task-checklist}}

## Story Details

- **Story ID**: {{story-id}}
- **Epic**: {{epic-name}}
- **Priority**: {{priority-level}}
- **Estimated Effort**: {{effort-estimate}}

## AI-SQUAD Metadata

- **Source File**: {{source-file-path}}
- **Created By**: AI-SQUAD {{agent-name}}
- **Workflow**: {{workflow-name}}
- **Generated**: {{timestamp}}

---

_This issue was automatically generated from AI-SQUAD workflow. Updates to this issue will be synchronized with the local story file._
```

### 5. Set Milestone and Project Association

[[LLM: Associate issue with appropriate milestone and project]]

**Milestone Assignment**:

- If story is part of epic, assign to epic milestone
- If no epic milestone exists, create it automatically
- Use epic title as milestone title
- Set milestone due date based on epic timeline

**Project Assignment**:

- Add issue to configured GitHub Project
- Set initial status based on story state:
  - Draft stories → "Todo" column
  - Ready stories → "Todo" column
  - In Progress → "In Progress" column
  - Complete → "Done" column

### 6. Create GitHub Issue

[[LLM: Execute the GitHub API call to create the issue]]

Create issue using GitHub API:

1. POST to `/repos/{owner}/{repo}/issues`
2. Set title, body, labels, assignee, milestone
3. Handle API rate limiting and errors
4. Capture created issue ID and URL

Example API payload:

```json
{
  "title": "[STORY-001] User Login Authentication",
  "body": "{{formatted-body}}",
  "labels": ["user-story", "priority-high", "status-ready"],
  "assignee": "{{github-username}}",
  "milestone": {{milestone-id}}
}
```

### 7. Add to GitHub Project

[[LLM: Add the created issue to the GitHub Project board]]

Add issue to project:

1. POST to `/graphql` with ProjectV2 mutation
2. Add issue to project using project ID
3. Set appropriate status/column
4. Set any custom field values
5. Handle GraphQL errors and retries

### 8. Update Local Story File

[[LLM: Update the original story file with GitHub information]]

Update story file with GitHub metadata:

```markdown
## GitHub Integration

- **Issue ID**: #{{issue-number}}
- **Issue URL**: {{issue-url}}
- **Project URL**: {{project-url}}
- **Created**: {{timestamp}}
- **Last Sync**: {{timestamp}}
```

Add GitHub reference to story metadata section if exists.

### 9. Update Workflow Plan

[[LLM: Update the workflow plan with GitHub issue reference]]

If story is part of active workflow plan:

- Add GitHub issue ID to corresponding workflow step
- Update step metadata with issue URL
- Mark step as "GitHub integrated"
- Update workflow plan timestamp

### 10. Handle Epic/Milestone Management

[[LLM: Manage epic-level GitHub organization]]

**For Epic Issues**:

- Create GitHub milestone if it doesn't exist
- Set milestone description from epic description
- Associate all epic stories with milestone
- Set milestone due date from epic timeline

**For Story Issues in Epic**:

- Assign to existing epic milestone
- Link to epic issue in description
- Add epic label for organization

### 11. Set Up Issue Templates

[[LLM: Ensure proper issue templates are configured]]

If issue templates don't exist in repository:

- Create `.github/ISSUE_TEMPLATE/` directory
- Generate templates for each issue type:
  - `user-story.md`
  - `epic.md`
  - `task.md`
  - `bug-report.md`
- Configure templates with AI-SQUAD specific fields

### 12. Generate Creation Report

[[LLM: Provide feedback on issue creation results]]

Generate creation report:

```markdown
# GitHub Issue Created

## Issue Details

- **Title**: {{issue-title}}
- **Number**: #{{issue-number}}
- **URL**: {{issue-url}}
- **Type**: {{issue-type}}
- **Priority**: {{priority}}

## Project Integration

- **Project**: {{project-name}}
- **Column**: {{initial-column}}
- **Milestone**: {{milestone-name}}

## Local Integration

- **Story File**: {{story-file-path}}
- **Workflow Plan**: {{workflow-plan-updated}}
- **Next Sync**: {{next-sync-time}}

## Quick Actions

- View Issue: {{issue-url}}
- View Project: {{project-url}}
- Edit Story: {{story-file-path}}
```

## Error Handling

### API Errors

- **Rate Limiting**: Implement exponential backoff and retry
- **Authentication**: Provide clear error messages for token issues
- **Permissions**: Guide user to required repository/project permissions
- **Network**: Handle connectivity issues gracefully

### Validation Errors

- **Missing Fields**: Prompt for required information
- **Invalid Configuration**: Guide user to fix configuration
- **Duplicate Issues**: Detect and handle duplicate creation attempts

### Recovery Options

- **Partial Failure**: Complete what's possible, report what failed
- **Rollback**: Ability to delete created issue if later steps fail
- **Manual Completion**: Provide manual steps if automation fails

## Integration with Other Tasks

### Called By

- `create-next-story` task can automatically create GitHub issue
- `sync-github-projects` task creates missing issues during sync
- Manual invocation by GitHub PM agent

### Calls

- `update-kanban-status` to set initial project status
- `sync-github-projects` to perform immediate sync
- Workflow plan update utilities

## Success Criteria

Issue creation is successful when:

1. GitHub issue is created with proper content and metadata
2. Issue is added to correct project and column
3. Local story file is updated with GitHub references
4. Workflow plan reflects GitHub integration
5. Epic/milestone association is correct
6. All configured labels and assignees are set

## Usage Examples

### Create Issue from Story File

```
User: "Create GitHub issue for story-001.md"
GitHub PM: "Creating GitHub issue from story file..."
[Parses story, creates issue, updates files]
GitHub PM: "✅ Created issue #123: User Authentication Story"
```

### Create Epic Issue

```
User: "Create GitHub issue for Payment Epic"
GitHub PM: "Creating epic issue and milestone..."
[Creates milestone, epic issue, updates project]
GitHub PM: "✅ Created epic #124 with milestone 'Payment System'"
```

### Bulk Creation from Workflow

```
User: "Create GitHub issues for all stories in current workflow"
GitHub PM: "Found 8 stories without GitHub issues. Creating..."
[Creates issues for each story, maintains relationships]
GitHub PM: "✅ Created 8 issues, all added to project board"
```

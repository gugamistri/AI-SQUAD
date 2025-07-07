# Sync GitHub Projects Task

## Purpose

Synchronize AI-SQUAD workflow plans with GitHub Projects V2, maintaining bidirectional sync between local workflow tracking and GitHub Kanban boards. This task handles the mapping between AI-SQUAD concepts (stories, epics, tasks) and GitHub entities (issues, milestones, project items).

## Task Instructions

### 1. Load Configuration and Validate Setup

[[LLM: First check if GitHub integration is enabled and properly configured]]

Check GitHub configuration from core-config.yaml:

- Verify `github.enabled` is true
- Validate required fields: `apiToken`, `repository`, `projectId`
- Test GitHub API connectivity
- Verify project permissions (read/write access to repository and projects)

If configuration is invalid or missing:

```
GitHub integration not configured. Please run:
*setup-github command to configure GitHub integration
```

### 2. Analyze Current Workflow State

[[LLM: Load and parse the current workflow plan to understand what needs to be synced]]

Load workflow plan from `workflow.planFile` (default: docs/workflow-plan.md):

- Parse workflow metadata (workflow-id, status, version)
- Extract all steps with their current status
- Identify decision points and their resolution
- Extract story references and epic information
- Note any existing GitHub references or issue IDs

### 3. Query GitHub Project State

[[LLM: Fetch current state from GitHub to compare with local workflow]]

Using GitHub API, fetch:

- Project structure and column configuration
- All issues related to current workflow/epic
- Project items and their current status
- Milestone information (if epics are mapped to milestones)
- Recent activity and updates

### 4. Perform Sync Analysis

[[LLM: Compare local and GitHub state to determine what needs to be synchronized]]

Compare local workflow state with GitHub state:

**Local → GitHub (Push changes)**:

- New stories without corresponding GitHub issues
- Status changes in workflow plan not reflected in GitHub
- Completed tasks that should close GitHub issues
- New decision points or notes to add to GitHub

**GitHub → Local (Pull changes)**:

- Issues updated in GitHub but not in local workflow
- Status changes in GitHub project not reflected locally
- New comments or updates from team members
- Closed issues that should update local workflow

### 5. Execute Synchronization

[[LLM: Perform the actual synchronization operations]]

#### 5.1 Create Missing GitHub Issues

For each story/task in workflow plan without GitHub issue:

1. Create GitHub issue using story template
2. Set appropriate labels based on `issueMapping` configuration
3. Assign to milestone if epic-level tracking is enabled
4. Add to GitHub Project with correct status column
5. Update local workflow plan with GitHub issue ID

#### 5.2 Update GitHub Project Status

For each status change in local workflow:

1. Find corresponding GitHub project item
2. Move item to appropriate column based on `kanbanColumns` mapping
3. Update issue status if applicable
4. Add timeline comment with status change reason

#### 5.3 Update Local Workflow

For each change detected in GitHub:

1. Update corresponding workflow plan step status
2. Add GitHub activity as workflow notes
3. Mark decision points as resolved if issues are closed
4. Update completion timestamps and metadata

### 6. Handle Bidirectional Sync Conflicts

[[LLM: When both local and GitHub have conflicting changes]]

If conflicts are detected:

1. Present conflict summary to user
2. Offer resolution options:
   - Prefer local changes (push to GitHub)
   - Prefer GitHub changes (pull to local)
   - Manual resolution (show diff and let user decide)
3. Apply chosen resolution
4. Document conflict resolution in workflow plan

### 7. Update Kanban Board Structure

[[LLM: Ensure GitHub project structure matches configuration]]

Verify and update GitHub project structure:

- Ensure all configured columns exist in `kanbanColumns`
- Create missing columns if needed
- Set up automation rules for column transitions
- Configure issue templates and labels

### 8. Generate Sync Report

[[LLM: Provide comprehensive report of synchronization results]]

Generate detailed sync report:

```markdown
# GitHub Sync Report - {{timestamp}}

## Sync Summary

- **Direction**: Bidirectional
- **Workflow**: {{workflow-name}}
- **GitHub Project**: {{project-name}}
- **Issues Processed**: {{count}}

## Changes Made

### Local → GitHub

- {{count}} new issues created
- {{count}} status updates pushed
- {{count}} project items moved

### GitHub → Local

- {{count}} status updates pulled
- {{count}} workflow steps updated
- {{count}} new comments added

## Conflicts Resolved

{{list any conflicts and their resolution}}

## Next Sync Scheduled

{{next-sync-time based on syncInterval}}
```

### 9. Schedule Next Sync

[[LLM: Set up automated sync if configured]]

If `syncOptions.bidirectionalSync` is enabled:

- Schedule next sync based on `syncInterval`
- Set up webhook listeners for real-time updates
- Configure automated sync triggers

## Sync Mapping Rules

### Story → GitHub Issue

- **Title**: Story title
- **Body**: Story description + acceptance criteria
- **Labels**: Based on `issueMapping` configuration
- **Milestone**: Epic name (if applicable)
- **Assignee**: Story assignee (if specified)

### Workflow Status → Kanban Column

- **Planning**: "Todo" column
- **In Progress**: "In Progress" column
- **Review**: "Human Review" column
- **Complete**: "Done" column
- **Blocked**: "No Status" column with blocked label

### Epic → GitHub Milestone

- **Title**: Epic name
- **Description**: Epic description
- **Due Date**: Epic target completion date
- **Issues**: All stories within epic

## Error Handling

### API Rate Limiting

- Implement exponential backoff
- Respect GitHub API rate limits
- Queue operations when rate limited
- Provide progress feedback to user

### Network/Connectivity Issues

- Retry failed operations
- Cache partial results
- Provide offline mode capability
- Resume sync when connectivity restored

### Permission Issues

- Validate permissions before operations
- Provide clear error messages
- Suggest permission fixes
- Graceful degradation for read-only access

## Integration Points

### With Other Tasks

- Called by `update-workflow-plan` when workflow changes
- Triggered by `create-github-issue` after issue creation
- Invoked by `update-kanban-status` for status updates

### With Workflow Management

- Updates workflow plan with GitHub references
- Preserves workflow history and metadata
- Maintains workflow integrity during sync

## Success Criteria

Sync is successful when:

1. All workflow items have corresponding GitHub issues
2. Status consistency between local and GitHub
3. No data loss during synchronization
4. Conflict resolution is properly documented
5. Next sync is properly scheduled
6. All team members can see unified view

## Usage Examples

### Manual Sync

```
User: "Sync my workflow with GitHub"
GitHub PM: "Analyzing workflow plan and GitHub project state..."
[Performs sync analysis and operations]
GitHub PM: "Sync completed. 5 issues created, 3 status updates pushed."
```

### Automated Sync

```
GitHub PM: "Scheduled sync detected changes in GitHub project."
[Performs automatic bidirectional sync]
GitHub PM: "Workflow updated with 2 status changes from GitHub."
```

### Conflict Resolution

```
GitHub PM: "Sync conflict detected: Story XYZ marked complete locally but reopened in GitHub."
[Presents resolution options]
User: "Prefer GitHub status"
GitHub PM: "Resolved conflict. Story XYZ marked as reopened in workflow plan."
```

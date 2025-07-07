# Update Kanban Status Task

## Purpose

Update GitHub Project Kanban board status based on AI-SQUAD workflow progress, maintaining synchronization between local workflow state and GitHub project columns. This task handles the movement of issues between Kanban columns and updates project status in real-time.

## Task Instructions

### 1. Validate GitHub Integration

[[LLM: Ensure GitHub integration is properly configured and accessible]]

Check GitHub configuration:

- Verify `github.enabled` is true
- Validate API token and project access
- Test GitHub Projects V2 API connectivity
- Confirm project write permissions

If integration is not available:

```
GitHub integration not configured or accessible.
Run *setup-github or *validate-config to resolve.
```

### 2. Identify Status Update Trigger

[[LLM: Understand what triggered the status update and what needs to be changed]]

Determine update trigger:

**Workflow Plan Update**:

- Step marked as complete/incomplete
- Story status changed
- Decision point resolved
- Blocker added/removed

**Manual Update**:

- User requesting specific status change
- Bulk status update
- Status correction/sync

**Story Development**:

- Story moved to "In Progress"
- Story completed by Dev agent
- Story ready for review
- Story approved/rejected

### 3. Parse Current Status Information

[[LLM: Get current status from both local workflow and GitHub]]

Extract current state:

**From Local Workflow**:

- Parse workflow plan for current step status
- Identify story/epic/task status
- Check completion timestamps
- Review any status notes or comments

**From GitHub**:

- Query current issue status in project
- Get current column/status value
- Check recent issue activity
- Verify assignee and labels

### 4. Map Status to Kanban Column

[[LLM: Translate AI-SQUAD status to appropriate GitHub project column]]

Apply status mapping based on `kanbanColumns` configuration:

**AI-SQUAD Status → GitHub Column**:

- `draft` → "No Status"
- `ready` → "Todo"
- `in_progress` → "In Progress"
- `review` → "Human Review"
- `completed` → "Done"
- `blocked` → "No Status" (with blocked label)
- `on_hold` → "No Status" (with on-hold label)

**Special Cases**:

- Stories with failing tests → "Human Review"
- Stories with unresolved dependencies → "No Status"
- Stories pending user acceptance → "Human Review"

### 5. Update GitHub Project Item

[[LLM: Execute the actual status update in GitHub Projects]]

Update project item status:

#### For GitHub Projects V2 (GraphQL API):

```graphql
mutation {
  updateProjectV2ItemFieldValue(
    input: {
      projectId: "{{project-id}}"
      itemId: "{{item-id}}"
      fieldId: "{{status-field-id}}"
      value: { singleSelectOptionId: "{{column-option-id}}" }
    }
  ) {
    projectV2Item {
      id
    }
  }
}
```

#### Handle API Operations:

1. Get project item ID for the issue
2. Get field ID for status column
3. Get option ID for target status
4. Execute update mutation
5. Handle rate limiting and retries

### 6. Update Issue Labels and Metadata

[[LLM: Update issue labels and metadata to reflect new status]]

Update issue labels based on status:

- Add status-specific labels (e.g., "in-review", "blocked")
- Remove outdated status labels
- Add/remove priority labels if changed
- Update assignee if status change affects ownership

Example label updates:

```
Status: "In Progress" → Add "status-in-progress", Remove "status-todo"
Status: "Blocked" → Add "status-blocked", Add "priority-high"
Status: "Done" → Add "status-done", Remove "status-in-progress"
```

### 7. Add Timeline Comment

[[LLM: Add a comment to the issue documenting the status change]]

Add GitHub issue comment:

```markdown
## Status Update: {{old-status}} → {{new-status}}

**Changed by**: AI-SQUAD {{agent-name}}  
**Timestamp**: {{timestamp}}  
**Trigger**: {{update-trigger}}

{{additional-notes}}

---

_Automated update from AI-SQUAD workflow synchronization_
```

### 8. Update Local Workflow Plan

[[LLM: Ensure local workflow plan reflects the status change]]

Update workflow plan if needed:

- Mark workflow step as updated
- Add GitHub sync timestamp
- Update step metadata with GitHub references
- Add any GitHub-specific notes or comments

### 9. Handle Dependent Status Updates

[[LLM: Update related items when status changes affect dependencies]]

Check for dependent updates:

**When Story Moves to "Done"**:

- Check if all epic stories are complete
- Update epic status if all stories done
- Update milestone progress
- Trigger epic completion workflows

**When Story Moves to "Blocked"**:

- Check for dependent stories
- Update dependent story status if needed
- Add blocking relationships in GitHub
- Notify stakeholders of blockage

**When Story Moves to "In Progress"**:

- Update assignee if not set
- Set start timestamp
- Check for prerequisite completion

### 10. Sync with Team Notifications

[[LLM: Notify relevant team members of status changes]]

Send notifications for significant status changes:

- Story ready for review → Notify reviewer
- Story blocked → Notify stakeholders
- Epic completed → Notify product owner
- Critical path items → Notify project manager

### 11. Update Workflow Metrics

[[LLM: Update any metrics tracking for the workflow]]

Update workflow tracking:

- Calculate completion percentage
- Update velocity metrics
- Track cycle time for completed items
- Update burndown chart data
- Log status change for reporting

### 12. Generate Status Update Report

[[LLM: Provide feedback on the status update operation]]

Generate update report:

```markdown
# Kanban Status Update Report

## Updated Items

- **{{issue-title}}** (#{{issue-number}})
  - Status: {{old-status}} → {{new-status}}
  - Column: {{old-column}} → {{new-column}}
  - Updated: {{timestamp}}

## Related Updates

- {{dependent-item-updates}}
- {{epic-progress-updates}}
- {{milestone-updates}}

## Workflow Impact

- Overall Progress: {{completion-percentage}}%
- Items in Progress: {{in-progress-count}}
- Items Blocked: {{blocked-count}}
- Next Review: {{next-review-date}}

## Actions Required

{{any-required-actions}}
```

## Bulk Status Updates

### Multiple Items

Handle bulk updates efficiently:

- Batch API calls to respect rate limits
- Process updates in dependency order
- Provide progress feedback for large batches
- Handle partial failures gracefully

### Workflow Transitions

Handle major workflow transitions:

- Epic completion (all stories done)
- Sprint/milestone completion
- Project phase transitions
- Team handoffs

## Error Handling

### API Errors

- **GraphQL Errors**: Parse and provide meaningful error messages
- **Rate Limiting**: Implement exponential backoff and queuing
- **Network Issues**: Retry with timeout handling
- **Permission Errors**: Provide clear guidance on required permissions

### Data Consistency

- **Sync Conflicts**: Detect and resolve conflicts between local and GitHub
- **Stale Data**: Refresh GitHub state before updates
- **Race Conditions**: Handle concurrent updates safely

### Recovery

- **Partial Updates**: Complete what's possible, report failures
- **Rollback**: Ability to revert status changes if needed
- **Manual Intervention**: Provide manual steps when automation fails

## Integration Points

### Called By

- `update-workflow-plan` task when workflow steps change
- `dev` agent when story development progresses
- `sync-github-projects` during bidirectional sync
- Manual invocation by GitHub PM agent

### Calls

- GitHub Projects V2 API for status updates
- GitHub Issues API for label updates
- Notification systems for team updates
- Metrics tracking systems

## Success Criteria

Status update is successful when:

1. GitHub project item moved to correct column
2. Issue labels updated appropriately
3. Timeline comment added to issue
4. Local workflow plan updated if needed
5. Dependent items updated correctly
6. Team notifications sent as needed
7. Metrics and reporting updated

## Usage Examples

### Single Story Status Update

```
User: "Mark story XYZ as completed"
GitHub PM: "Updating story status in GitHub project..."
[Updates project item, adds labels, creates comment]
GitHub PM: "✅ Story XYZ moved to Done column"
```

### Workflow Progress Update

```
SM Agent: "Story ABC development completed"
[Triggers automatic status update]
GitHub PM: "Story ABC moved from In Progress to Human Review"
[Updates GitHub, notifies reviewer]
```

### Bulk Epic Completion

```
GitHub PM: "All epic stories completed. Updating epic status..."
[Updates all related stories, epic issue, milestone]
GitHub PM: "✅ Epic completed. 8 stories moved to Done."
```

### Status Sync Correction

```
GitHub PM: "Detected status mismatch during sync"
[Compares local and GitHub status]
GitHub PM: "Corrected 3 items to match workflow plan status"
```

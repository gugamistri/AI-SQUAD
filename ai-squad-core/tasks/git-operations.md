# Git Operations Task

## Purpose

Handle git operations for AI-SQUAD workflows including automated commits, pushes, branch management, and pull request creation. This task integrates git version control with AI-SQUAD story development and GitHub project management.

## Task Instructions

### 1. Validate Git and GitHub Setup

[[LLM: Ensure git environment and GitHub integration are properly configured]]

Verify setup:

- Check git is installed and repository is initialized
- Validate GitHub remote configuration
- Test git credentials and GitHub authentication
- Verify repository write permissions
- Check if working directory is clean or has staged changes

If setup is invalid:

```
Git repository not configured or GitHub authentication failed.
Please ensure:
1. Git repository is initialized
2. GitHub remote is configured
3. GitHub authentication is working (gh auth status)
```

### 2. Determine Operation Type

[[LLM: Understand what git operation is being requested]]

Identify operation type:

**Story Development Workflow**:

- Create feature branch for story
- Commit story implementation
- Push branch to GitHub
- Create pull request for review

**Workflow Synchronization**:

- Commit workflow plan updates
- Sync documentation changes
- Update story files with GitHub metadata

**Manual Operations**:

- Custom commit with user message
- Branch management operations
- Emergency commits and pushes

### 3. Branch Management

[[LLM: Handle branch creation, switching, and management]]

#### Create Feature Branch

For story development:

1. Generate branch name using `gitOperations.branchNaming` pattern
2. Create branch from main/master branch
3. Switch to new branch
4. Update local tracking

Example branch naming:

```bash
# Pattern: ai-squad/{story-id}
git checkout -b ai-squad/user-auth-story-001
git checkout -b ai-squad/payment-integration-epic-002
git checkout -b ai-squad/bug-fix-login-issue-003
```

#### Branch Validation

Before operations:

- Ensure branch name follows conventions
- Check if branch already exists locally/remotely
- Validate branch is up to date with remote
- Handle merge conflicts if present

### 4. Stage and Commit Changes

[[LLM: Handle git staging and commit operations]]

#### Auto-detect Changes

Scan for changes related to current operation:

- Story files in `docs/stories/`
- Workflow plan updates in `docs/workflow-plan.md`
- Implementation files (from story File List)
- Documentation updates
- Configuration changes

#### Staging Strategy

Based on operation type:

**Story Implementation**:

- Stage all files listed in story File List
- Stage story file updates (GitHub metadata, completion notes)
- Stage test files and documentation
- Exclude temporary files and logs

**Workflow Updates**:

- Stage workflow plan file
- Stage related story files
- Stage configuration updates
- Exclude implementation files

#### Generate Commit Message

Use configured pattern from `gitOperations.commitMessage`:

```bash
# Pattern: "feat: {story-title} - AI-SQUAD generated"
feat: User Authentication System - AI-SQUAD generated

- Implement login/logout functionality
- Add JWT token management
- Update user session handling
- Add authentication middleware

Story-ID: user-auth-story-001
Agent: dev
Completed: 2024-01-15T10:30:00Z
```

### 5. Execute Git Commit

[[LLM: Perform the actual git commit operation]]

Execute commit with proper error handling:

```bash
git add {{staged-files}}
git commit -m "{{commit-message}}"
```

Handle common git issues:

- **Empty commit**: Use `--allow-empty` for metadata-only updates
- **Large files**: Warn about file sizes, suggest git LFS
- **Binary files**: Confirm inclusion of binary files
- **Merge conflicts**: Guide user through resolution

### 6. Push to Remote Repository

[[LLM: Push changes to GitHub repository]]

Push operations based on configuration:

#### Automatic Push (if `gitOperations.autoPush` is true):

```bash
git push origin {{branch-name}}
```

#### Manual Push Confirmation:

Present push options to user:

```
Changes committed locally. Push options:
1. Push to GitHub now
2. Push and create pull request
3. Keep local only (push later)
4. Review changes before push
```

#### Handle Push Scenarios:

- **New branch**: Use `-u` flag to set upstream
- **Existing branch**: Regular push with conflict detection
- **Force push**: Only with explicit user confirmation
- **Protected branch**: Handle branch protection rules

### 7. Pull Request Creation

[[LLM: Create GitHub pull request if configured or requested]]

#### Automatic PR Creation (if `gitOperations.createPR` is true):

Generate PR using GitHub CLI:

```bash
gh pr create \
  --title "{{pr-title}}" \
  --body "{{pr-body}}" \
  --base main \
  --head {{branch-name}}
```

#### PR Content Generation:

```markdown
# {{story-title}}

## Description

{{story-description}}

## Changes Made

{{file-changes-summary}}

## Testing

{{testing-completed}}

## Story Details

- **Story ID**: {{story-id}}
- **Epic**: {{epic-name}}
- **Agent**: {{implementing-agent}}
- **Story File**: {{story-file-path}}

## Checklist

- [x] All acceptance criteria met
- [x] Tests passing
- [x] Code follows project standards
- [x] Documentation updated

---

_This PR was automatically generated from AI-SQUAD story development._
```

### 8. Handle Git Configuration

[[LLM: Manage git configuration specific to AI-SQUAD operations]]

#### Set Git Identity:

```bash
git config user.name "AI-SQUAD Bot"
git config user.email "ai-squad@example.com"
```

#### Configure Git Hooks:

- Pre-commit hooks for code formatting
- Pre-push hooks for test validation
- Post-commit hooks for status updates

#### Git Ignore Management:

Ensure `.gitignore` includes:

```
# AI-SQUAD specific
.ai/debug-log.md
*.ai-temp
.ai-squad-cache/

# IDE and temporary files
.vscode/settings.json
*.swp
*.tmp
```

### 9. Sync with GitHub Issues

[[LLM: Update GitHub issues with git commit information]]

After successful commit/push:

- Add commit SHA to GitHub issue comments
- Update issue with branch information
- Link commit to issue using keywords
- Update project status if configured

Example issue comment:

```markdown
## Development Progress

**Branch**: `ai-squad/user-auth-story-001`  
**Latest Commit**: {{commit-sha}}  
**Files Changed**: {{file-count}}

### Recent Changes

{{commit-message}}

**Status**: Implementation completed, ready for review
```

### 10. Handle Repository State

[[LLM: Manage repository state and workspace cleanup]]

#### Clean Workspace:

- Stash uncommitted changes if needed
- Clean untracked files (with confirmation)
- Reset to clean state if requested

#### Branch Cleanup:

- Delete merged feature branches
- Update branch tracking information
- Prune remote branch references

#### Conflict Resolution:

Provide guidance for merge conflicts:

```
Merge conflict detected in {{file-name}}:
1. Open file in editor
2. Resolve conflict markers (<<<<<<< ======= >>>>>>>)
3. Run 'git add {{file-name}}'
4. Continue with 'git commit'
```

### 11. Integration with Story Development

[[LLM: Coordinate git operations with story development workflow]]

#### Story Completion Flow:

1. Dev agent completes story implementation
2. Story DOD checklist completed
3. Auto-commit implementation changes
4. Push to GitHub (if configured)
5. Create PR for review
6. Update story status to "Ready for Review"

#### Epic Management:

- Create epic branch for multiple stories
- Merge story branches into epic branch
- Create epic PR when all stories complete

### 12. Generate Operation Report

[[LLM: Provide comprehensive report of git operations performed]]

Generate git operations report:

```markdown
# Git Operations Report

## Operations Completed

- **Branch**: {{branch-name}}
- **Commits**: {{commit-count}}
- **Files Changed**: {{file-count}}
- **Lines Added/Removed**: +{{additions}}/-{{deletions}}

## Commit Details

### {{commit-sha-short}}

**Message**: {{commit-message}}  
**Files**: {{changed-files}}  
**Timestamp**: {{commit-timestamp}}

## Remote Operations

- **Push Status**: {{push-status}}
- **PR Created**: {{pr-url}}
- **GitHub Issue Updated**: {{issue-updated}}

## Next Steps

{{recommended-next-actions}}
```

## Error Handling

### Git Errors

- **Merge Conflicts**: Provide conflict resolution guidance
- **Authentication**: Help with GitHub credentials setup
- **Permission Issues**: Guide to repository access requirements
- **Network Issues**: Handle connectivity problems gracefully

### Repository Issues

- **Dirty Workspace**: Options to stash, commit, or discard changes
- **Detached HEAD**: Guide back to proper branch
- **Large Files**: Warnings and LFS suggestions
- **Branch Protection**: Handle protected branch restrictions

## Integration Points

### Called By

- `dev` agent after story completion
- `update-workflow-plan` for workflow commits
- `sync-github-projects` for metadata updates
- Manual invocation by GitHub PM agent

### Calls

- GitHub CLI for PR operations
- GitHub API for issue updates
- `update-kanban-status` after PR creation
- Notification systems for team updates

## Success Criteria

Git operation is successful when:

1. Changes are properly committed with descriptive messages
2. Branch is pushed to GitHub (if configured)
3. Pull request is created (if configured)
4. GitHub issues are updated with commit information
5. Local repository is in clean state
6. Story files are updated with git metadata

## Usage Examples

### Story Implementation Commit

```
Dev Agent: "Story implementation completed"
GitHub PM: "Committing changes and creating PR..."
[Creates branch, commits files, pushes, creates PR]
GitHub PM: "✅ PR created: #45 - User Authentication System"
```

### Workflow Update Commit

```
User: "Commit workflow plan updates"
GitHub PM: "Committing workflow plan changes..."
[Commits workflow plan, pushes to main branch]
GitHub PM: "✅ Workflow plan updated in repository"
```

### Emergency Commit

```
User: "Emergency commit: fix critical bug"
GitHub PM: "Creating emergency commit and push..."
[Commits urgent changes, pushes immediately]
GitHub PM: "✅ Emergency fix committed and pushed"
```

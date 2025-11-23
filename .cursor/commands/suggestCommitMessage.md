# Generate Git Commit Message

Please run the following steps to generate a short, succinct git commit message (4 lines total):

1. Run `git status --short` to see the current changes
2. Analyze the output and categorize the changes:
   - Added files (A)
   - Modified files (M)
   - Deleted files (D)
   - Renamed files (R)
   - Untracked files (??)
3. Generate a commit message with this format:
   - Line 1: Brief summary
   - Line 2 & 3 & 4: Deeper explanation of changes

The commit message should be:

- Concise (4 lines maximum)
- Descriptive of the main changes
- Focused on the most important modifications (limit to top 3 changes if many files changed)

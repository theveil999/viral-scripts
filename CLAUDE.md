# VIRAL SCRIPT GENERATION SYSTEM - AUTOMATED RECOVERY

## CRITICAL: READ THIS FIRST

This project is being recovered from a conversation transcript. The transcript has been split into chunks in `./chunks/`.

**YOUR TASK:** Process each chunk sequentially, extract file changes, compare to current codebase, and apply fixes.

---

## AUTOMATED RECOVERY PROTOCOL

When I say "start recovery" or "continue recovery", execute this protocol:

### STEP 1: Check Progress
```bash
cat ./chunks/progress.txt
```
This contains the last completed chunk number. Start from the next one.

### STEP 2: Read Current Chunk
```bash
CURRENT=$(cat ./chunks/progress.txt)
NEXT=$((CURRENT + 1))
CHUNK_FILE="./chunks/chunk_$(printf '%03d' $NEXT).txt"
if [ -f "$CHUNK_FILE" ]; then
    cat "$CHUNK_FILE"
else
    echo "DONE - All chunks processed"
fi
```

### STEP 3: Analyze the Chunk
For the chunk content, identify:
1. **File writes**: Any `cat > filepath << 'EOF'` or similar patterns
2. **File paths mentioned**: Files being created or modified
3. **Code content**: The actual code being written
4. **Configuration**: Environment variables, settings, etc.
5. **Schema changes**: SQL migrations, database changes

### STEP 4: Cross-Reference Current Codebase
For each file identified in the chunk:
1. Check if the file exists in current project
2. If exists: Compare content - note differences
3. If missing: Flag for creation
4. If different: Determine which version is correct (transcript = source of truth)

### STEP 5: Apply Fixes
For each discrepancy:
1. **Missing file**: Create it with content from transcript
2. **Different content**: Replace with transcript version
3. **Extra file not in transcript**: Leave it (might be from later chunks)

### STEP 6: Update Progress
```bash
echo "$NEXT" > ./chunks/progress.txt
```

### STEP 7: Commit Changes
```bash
git add -A
git commit -m "Recovery: chunk $NEXT applied"
```

### STEP 8: Continue to Next Chunk
Automatically proceed to Step 1 for the next chunk.

---

## FILE WRITE PATTERNS TO RECOGNIZE

The transcript uses these patterns for file creation:

### Heredoc Pattern (most common)
```
cat > path/to/file.ts << 'EOF'
file content here
EOF
```

### Mkdir + Heredoc
```
mkdir -p path/to && cat > path/to/file.ts << 'EOF'
file content here
EOF
```

### Echo Pattern
```
echo "content" > path/to/file.txt
```

### Multi-command
```
mkdir -p dir && cat > dir/file.ts << 'EOF'
content
EOF
```

---

## EXTRACTION RULES

1. **ONLY extract successful writes** - If a tool_result shows `'is_error': True`, skip that write
2. **Keep LAST version** - If a file is written multiple times, use the final version
3. **Preserve exact content** - Don't modify, format, or "improve" extracted code
4. **Track SQL schemas** - Collect all CREATE TABLE statements for database setup

---

## CURRENT PROJECT STRUCTURE

Before starting, map the current project:
```bash
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.sql" -o -name "*.json" | grep -v node_modules | grep -v .git | head -100
```

---

## COMMANDS

- **"start recovery"** - Begin from chunk 1
- **"continue recovery"** - Resume from last progress point  
- **"recovery status"** - Show current progress
- **"skip chunk"** - Mark current chunk done without applying (if it's just conversation)
- **"show diff [filepath]"** - Compare transcript version vs current version
- **"force apply [filepath]"** - Overwrite current file with transcript version

---

## IMPORTANT CONSTRAINTS

1. **NO HALLUCINATION**: Only use code that appears explicitly in the transcript chunks
2. **NO ASSUMPTIONS**: If something is unclear, flag it and move on
3. **NO IMPROVEMENTS**: Don't "fix" or "improve" extracted code - preserve exactly
4. **VERIFY EACH STEP**: After applying changes, verify the file exists and has correct content
5. **GIT SAFETY**: Always commit after each chunk so changes can be reverted

---

## ERROR HANDLING

If a chunk contains no file writes (just conversation):
- Note: "Chunk X: No file writes detected"
- Update progress and continue

If a file path is ambiguous:
- Use project root as base
- Flag for manual review in commit message

If content appears truncated:
- Flag in commit message
- Continue to next chunk (content might continue there)

---

## STARTUP SEQUENCE

When Claude Code starts, automatically:
1. Check if `./chunks/` directory exists
2. If not, prompt: "Run `python chunk_transcript.py <transcript_file> ./chunks` first"
3. If yes, show: "Ready for recovery. Say 'start recovery' or 'continue recovery'"

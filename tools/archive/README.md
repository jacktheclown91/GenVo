# Archived tools

On October 30, 2026, 626 scripts moved here from `tools/`. They are one-off review, capture, probe, profile and verification scripts from earlier passes, and nothing current referenced them: not the gate, tests, other tools, CI workflows or current documents.

Historical reports still name them as `tools/<name>`. Run them as `tools/archive/<name>` instead. Every relative path inside them was rewritten to point at the same file as before (for example `../src/` became `../../src/`). Strings that were never paths relative to the tool were left byte-for-byte, such as module names inside rebasing maps.

`git log --follow tools/archive/<name>` shows each file's full history.

# Assignment Storage System

A compact, minimalist system for storing and reviewing student assignment submissions.

## Stack
- **PHP** — handles the web UI, file uploads, validation, and JSON-based storage (`data/assignments.json`).
- **Java** — `java/AssignmentReport.java` reads the same data file and generates a summary report (totals, per-course, per-student), invoked on demand from `report.php` via `exec()`.
- **CSS** — single minimalist stylesheet (`style.css`), no frameworks.

## Structure
```
assignment-system/
├── index.php        # submission form + assignment list
├── upload.php        # handles file upload + saves metadata
├── delete.php         # removes a submission
├── report.php          # compiles/runs the Java report tool, shows output
├── config.php            # shared settings + helpers
├── style.css               # minimalist styling
├── data/assignments.json     # JSON "database" of submissions
├── uploads/                     # stored assignment files
└── java/AssignmentReport.java     # report generator
```

## Running it
1. Place the folder on a PHP-enabled server (PHP 8+ recommended), or run locally:
   ```
   php -S localhost:8000 -t assignment-system
   ```
2. Open `http://localhost:8000` in a browser.
3. For the Java report feature, a JDK (`javac`/`java`) must be available on the server's PATH — `report.php` compiles `AssignmentReport.java` once, then reuses the compiled class.

## Notes
- Allowed file types: pdf, doc, docx, txt, zip, java, py, c, cpp, js (edit `ALLOWED_EXT` in `config.php`).
- Max upload size: 10MB (edit `MAX_FILE_SIZE` in `config.php`).
- Storage is file-based (JSON + filesystem) — no database setup required. Swap `load_assignments()`/`save_assignments()` in `config.php` for a real DB if you outgrow this.

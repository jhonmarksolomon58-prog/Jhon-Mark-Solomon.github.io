<?php
require_once __DIR__ . '/config.php';

$assignments = array_reverse(load_assignments()); // newest first
$message = $_GET['msg'] ?? '';
$error = $_GET['err'] ?? '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Assignment Storage</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="wrap">

    <header>
        <h1>Assignment Storage</h1>
        <p class="sub">Submit and track student assignments</p>
    </header>

    <?php if ($message): ?>
        <div class="notice ok"><?= htmlspecialchars($message) ?></div>
    <?php endif; ?>
    <?php if ($error): ?>
        <div class="notice err"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <section class="card">
        <h2>New Submission</h2>
        <form action="upload.php" method="post" enctype="multipart/form-data">
            <div class="row">
                <label>Student Name
                    <input type="text" name="student_name" required maxlength="80">
                </label>
                <label>Student ID
                    <input type="text" name="student_id" required maxlength="40">
                </label>
            </div>
            <div class="row">
                <label>Course / Subject
                    <input type="text" name="course" required maxlength="80">
                </label>
                <label>Assignment Title
                    <input type="text" name="title" required maxlength="120">
                </label>
            </div>
            <label class="file-label">File (max 10MB)
                <input type="file" name="file" required>
            </label>
            <button type="submit">Submit Assignment</button>
        </form>
    </section>

    <section class="card">
        <div class="list-head">
            <h2>Submitted Assignments (<?= count($assignments) ?>)</h2>
            <a class="report-link" href="report.php">Generate Report (Java)</a>
        </div>

        <?php if (empty($assignments)): ?>
            <p class="empty">No assignments submitted yet.</p>
        <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>Student</th>
                    <th>ID</th>
                    <th>Course</th>
                    <th>Title</th>
                    <th>File</th>
                    <th>Size</th>
                    <th>Submitted</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($assignments as $a): ?>
                <tr>
                    <td><?= htmlspecialchars($a['student_name']) ?></td>
                    <td><?= htmlspecialchars($a['student_id']) ?></td>
                    <td><?= htmlspecialchars($a['course']) ?></td>
                    <td><?= htmlspecialchars($a['title']) ?></td>
                    <td><a href="uploads/<?= htmlspecialchars($a['stored_name']) ?>"><?= htmlspecialchars($a['original_name']) ?></a></td>
                    <td><?= human_size($a['size']) ?></td>
                    <td><?= htmlspecialchars($a['submitted_at']) ?></td>
                    <td>
                        <form action="delete.php" method="post" onsubmit="return confirm('Delete this submission?');">
                            <input type="hidden" name="id" value="<?= htmlspecialchars($a['id']) ?>">
                            <button class="del" type="submit">Delete</button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <?php endif; ?>
    </section>

</div>
</body>
</html>

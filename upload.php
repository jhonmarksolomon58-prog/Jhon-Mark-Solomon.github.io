<?php
require_once __DIR__ . '/config.php';

function fail(string $msg): void {
    header('Location: index.php?err=' . urlencode($msg));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Invalid request method.');
}

$student_name = trim($_POST['student_name'] ?? '');
$student_id   = trim($_POST['student_id'] ?? '');
$course       = trim($_POST['course'] ?? '');
$title        = trim($_POST['title'] ?? '');

if (!$student_name || !$student_id || !$course || !$title) {
    fail('All fields are required.');
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    fail('File upload failed.');
}

$file = $_FILES['file'];

if ($file['size'] > MAX_FILE_SIZE) {
    fail('File exceeds the 10MB limit.');
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, ALLOWED_EXT, true)) {
    fail('File type not allowed: .' . $ext);
}

$id = bin2hex(random_bytes(8));
$stored_name = $id . '_' . safe_filename($file['name']);
$destination = UPLOAD_DIR . $stored_name;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    fail('Could not save the uploaded file.');
}

$assignments = load_assignments();
$assignments[] = [
    'id'            => $id,
    'student_name'  => $student_name,
    'student_id'    => $student_id,
    'course'        => $course,
    'title'         => $title,
    'original_name' => $file['name'],
    'stored_name'   => $stored_name,
    'size'          => $file['size'],
    'submitted_at'  => date('Y-m-d H:i:s'),
];
save_assignments($assignments);

header('Location: index.php?msg=' . urlencode('Assignment submitted successfully.'));
exit;

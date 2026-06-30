<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_POST['id'])) {
    header('Location: index.php?err=' . urlencode('Invalid delete request.'));
    exit;
}

$id = $_POST['id'];
$assignments = load_assignments();
$kept = [];
$found = null;

foreach ($assignments as $a) {
    if ($a['id'] === $id) {
        $found = $a;
    } else {
        $kept[] = $a;
    }
}

if ($found) {
    $path = UPLOAD_DIR . $found['stored_name'];
    if (file_exists($path)) {
        unlink($path);
    }
    save_assignments($kept);
    header('Location: index.php?msg=' . urlencode('Submission deleted.'));
} else {
    header('Location: index.php?err=' . urlencode('Submission not found.'));
}
exit;

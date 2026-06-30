<?php
// config.php — shared settings + helpers for the assignment storage system

define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('DATA_FILE', __DIR__ . '/data/assignments.json');
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10 MB
define('ALLOWED_EXT', ['pdf', 'doc', 'docx', 'txt', 'zip', 'java', 'py', 'c', 'cpp', 'js']);

if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}
if (!file_exists(DATA_FILE)) {
    file_put_contents(DATA_FILE, json_encode([]));
}

function load_assignments(): array {
    $raw = file_get_contents(DATA_FILE);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function save_assignments(array $data): void {
    // Simple file lock to avoid corruption under concurrent writes
    $fp = fopen(DATA_FILE, 'c+');
    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
        fflush($fp);
        flock($fp, LOCK_UN);
    }
    fclose($fp);
}

function safe_filename(string $name): string {
    $name = preg_replace('/[^A-Za-z0-9._-]/', '_', $name);
    return substr($name, 0, 150);
}

function human_size(int $bytes): string {
    $units = ['B', 'KB', 'MB', 'GB'];
    $i = 0;
    while ($bytes >= 1024 && $i < count($units) - 1) {
        $bytes /= 1024;
        $i++;
    }
    return round($bytes, 1) . ' ' . $units[$i];
}

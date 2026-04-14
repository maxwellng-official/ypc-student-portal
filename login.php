<?php
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$body     = json_decode(file_get_contents('php://input'), true) ?? [];
$ypc_id   = trim($body['ypc_id']   ?? '');
$password = trim($body['password'] ?? '');

if (!$ypc_id || !$password) {
    jsonResponse(['error' => 'Student ID and password are required'], 400);
}

$pdo  = getDB();
$stmt = $pdo->prepare(
    'SELECT id, ypc_id, ljmu_id, name, email, password_hash, programme, semester, cgpa, phone, ic_number, intake_date, status
     FROM students WHERE ypc_id = ? LIMIT 1'
);
$stmt->execute([$ypc_id]);
$student = $stmt->fetch();

if (!$student || !password_verify($password, $student['password_hash'])) {
    jsonResponse(['error' => 'Invalid Student ID or password'], 401);
}

if ($student['status'] !== 'active') {
    jsonResponse(['error' => 'Account suspended. Please contact the Registrar.'], 403);
}

unset($student['password_hash'], $student['id']);
jsonResponse(['success' => true, 'student' => $student]);

<?php
// ============================================================
//  Admin — Search Student by YPC ID
//  GET ?ypc_id=23BIS12345
//  Returns { success: true, student: { ... } }
// ============================================================
require_once __DIR__ . '/config.php';

$ypcId = trim($_GET['ypc_id'] ?? '');

if (!$ypcId) {
    jsonResponse(['success' => false, 'error' => 'ypc_id is required'], 400);
}

try {
    $db   = getDB();
    $stmt = $db->prepare(
        'SELECT ypc_id, ljmu_id, name, email, programme, semester, cgpa, phone, ic_number, intake_date, status
         FROM students WHERE ypc_id = ? LIMIT 1'
    );
    $stmt->execute([$ypcId]);
    $student = $stmt->fetch();

    if (!$student) {
        jsonResponse(['success' => false, 'error' => 'No student found with that ID'], 404);
    }

    jsonResponse(['success' => true, 'student' => $student]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error'], 500);
}

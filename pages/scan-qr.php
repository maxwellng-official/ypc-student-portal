<?php
// ============================================================
//  QR Scan Endpoint — for lecturer use
//  POST { "token": "<qr_token>", "lecturer": "Name" }
//  Returns student + exam info and marks attendance
// ============================================================
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$body       = json_decode(file_get_contents('php://input'), true) ?? [];
$token      = trim($body['token']    ?? '');
$lecturer   = trim($body['lecturer'] ?? 'Unknown');

if (!$token) {
    jsonResponse(['error' => 'QR token is required'], 400);
}

$pdo  = getDB();
$stmt = $pdo->prepare(
    'SELECT e.id, e.exam_date, e.exam_time, e.hall, e.seat_number, e.semester,
            e.scanned_at, e.scanned_by, e.qr_token,
            sub.name AS subject, sub.code,
            st.name AS student_name, st.ypc_id, st.ljmu_id, st.programme
     FROM exam_slips e
     JOIN subjects  sub ON sub.id = e.subject_id
     JOIN students  st  ON st.id  = e.student_id
     WHERE e.qr_token = ?
     LIMIT 1'
);
$stmt->execute([$token]);
$slip = $stmt->fetch();

if (!$slip) {
    jsonResponse(['error' => 'Invalid or expired QR code'], 404);
}

// Mark attendance if not already scanned
$alreadyScanned = !empty($slip['scanned_at']);
if (!$alreadyScanned) {
    $update = $pdo->prepare(
        'UPDATE exam_slips SET scanned_at = NOW(), scanned_by = ? WHERE qr_token = ?'
    );
    $update->execute([$lecturer, $token]);
    $slip['scanned_at'] = date('Y-m-d H:i:s');
    $slip['scanned_by'] = $lecturer;
}

jsonResponse([
    'success'         => true,
    'already_scanned' => $alreadyScanned,
    'slip'            => $slip,
]);

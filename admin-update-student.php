<?php
// ============================================================
//  Admin — Update Student Record (locked fields)
//  POST { original_ypc_id, ypc_id, ljmu_id, name, email,
//         programme, semester, cgpa, status, admin_username }
// ============================================================
require_once __DIR__ . '/config.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$originalYpcId = trim($input['original_ypc_id'] ?? '');
$ypcId         = trim($input['ypc_id']    ?? '');
$ljmuId        = trim($input['ljmu_id']   ?? '');
$name          = trim($input['name']      ?? '');
$email         = trim($input['email']     ?? '');
$programme     = trim($input['programme'] ?? '');
$semester      = intval($input['semester'] ?? 1);
$cgpa          = round(floatval($input['cgpa'] ?? 0), 2);
$status        = in_array($input['status'] ?? '', ['active','suspended','graduated']) ? $input['status'] : 'active';

if (!$originalYpcId || !$ypcId || !$name || !$email) {
    jsonResponse(['success' => false, 'error' => 'Missing required fields'], 400);
}

try {
    $db   = getDB();
    $stmt = $db->prepare(
        'UPDATE students SET
            ypc_id = ?, ljmu_id = ?, name = ?, email = ?,
            programme = ?, semester = ?, cgpa = ?, status = ?
         WHERE ypc_id = ?'
    );
    $stmt->execute([$ypcId, $ljmuId, $name, $email, $programme, $semester, $cgpa, $status, $originalYpcId]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['success' => false, 'error' => 'Student not found or no changes made'], 404);
    }

    jsonResponse(['success' => true, 'message' => 'Student record updated']);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}

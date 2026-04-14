<?php
require __DIR__ . '/config.php';

$ypc_id = getYpcId();
if (!$ypc_id) jsonResponse(['error' => 'Missing ypc_id'], 400);

$pdo  = getDB();
$stmt = $pdo->prepare(
    'SELECT sub.name AS subject, sub.code, sub.credits, r.grade, r.score, r.semester
     FROM results r
     JOIN subjects sub ON sub.id = r.subject_id
     JOIN students st  ON st.id  = r.student_id
     WHERE st.ypc_id = ?
     ORDER BY r.semester DESC, sub.name'
);
$stmt->execute([$ypc_id]);
$results = $stmt->fetchAll();

$cgpaStmt = $pdo->prepare('SELECT cgpa FROM students WHERE ypc_id = ? LIMIT 1');
$cgpaStmt->execute([$ypc_id]);
$cgpa = $cgpaStmt->fetchColumn();

jsonResponse(['cgpa' => $cgpa, 'results' => $results]);

<?php
require __DIR__ . '/config.php';

$ypc_id = getYpcId();
if (!$ypc_id) jsonResponse(['error' => 'Missing ypc_id'], 400);

$pdo  = getDB();
$stmt = $pdo->prepare(
    'SELECT sub.name AS subject, sub.code, a.attended, a.total, a.semester
     FROM attendance a
     JOIN subjects  sub ON sub.id = a.subject_id
     JOIN students  st  ON st.id  = a.student_id
     WHERE st.ypc_id = ?
     ORDER BY sub.name'
);
$stmt->execute([$ypc_id]);
$rows = $stmt->fetchAll();

$total_attended = (int) array_sum(array_column($rows, 'attended'));
$total_classes  = (int) array_sum(array_column($rows, 'total'));
$overall        = $total_classes > 0 ? round(($total_attended / $total_classes) * 100) : 0;

jsonResponse([
    'overall'  => $overall,
    'attended' => $total_attended,
    'total'    => $total_classes,
    'absent'   => $total_classes - $total_attended,
    'subjects' => $rows,
]);

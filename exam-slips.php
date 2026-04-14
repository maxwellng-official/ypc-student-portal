<?php
require __DIR__ . '/config.php';

$ypc_id = getYpcId();
if (!$ypc_id) jsonResponse(['error' => 'Missing ypc_id'], 400);

$pdo  = getDB();
$stmt = $pdo->prepare(
    'SELECT e.id, e.exam_date, e.exam_time, e.hall, e.seat_number, e.semester,
            e.qr_token, e.scanned_at, e.scanned_by,
            sub.name AS subject, sub.code,
            st.name AS student_name, st.ypc_id, st.ljmu_id
     FROM exam_slips e
     JOIN subjects  sub ON sub.id = e.subject_id
     JOIN students  st  ON st.id  = e.student_id
     WHERE st.ypc_id = ?
     ORDER BY e.exam_date ASC, e.exam_time ASC'
);
$stmt->execute([$ypc_id]);
$slips = $stmt->fetchAll();

jsonResponse(['exam_slips' => $slips]);

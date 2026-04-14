<?php
require __DIR__ . '/config.php';

$ypc_id = getYpcId();
if (!$ypc_id) jsonResponse(['error' => 'Missing ypc_id'], 400);

$pdo  = getDB();
$stmt = $pdo->prepare(
    'SELECT sch.day, sch.time_start, sch.time_end, sch.room, sch.lecturer, sch.type,
            sub.name AS subject, sub.code
     FROM schedule sch
     JOIN subjects sub ON sub.id = sch.subject_id
     JOIN students st  ON st.id  = sch.student_id
     WHERE st.ypc_id = ?
     ORDER BY FIELD(sch.day,"Mon","Tue","Wed","Thu","Fri","Sat"), sch.time_start'
);
$stmt->execute([$ypc_id]);
$rows = $stmt->fetchAll();

// Group by day
$schedule = [];
foreach ($rows as $row) {
    $schedule[$row['day']][] = $row;
}

jsonResponse(['schedule' => $schedule]);

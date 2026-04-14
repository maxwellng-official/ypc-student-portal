<?php
require __DIR__ . '/config.php';

$ypc_id = getYpcId();
if (!$ypc_id) jsonResponse(['error' => 'Missing ypc_id'], 400);

$pdo  = getDB();
$stmt = $pdo->prepare(
    'SELECT ypc_id, ljmu_id, name, email, programme, semester, cgpa, phone, ic_number, intake_date, status
     FROM students WHERE ypc_id = ? LIMIT 1'
);
$stmt->execute([$ypc_id]);
$student = $stmt->fetch();

if (!$student) jsonResponse(['error' => 'Student not found'], 404);

jsonResponse(['student' => $student]);

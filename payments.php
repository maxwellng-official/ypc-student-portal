<?php
require __DIR__ . '/config.php';

$ypc_id = getYpcId();
if (!$ypc_id) jsonResponse(['error' => 'Missing ypc_id'], 400);

$pdo  = getDB();
$stmt = $pdo->prepare(
    'SELECT p.id, p.description, p.amount, p.due_date, p.paid_date, p.status, p.type, p.reference
     FROM payments p
     JOIN students s ON s.id = p.student_id
     WHERE s.ypc_id = ?
     ORDER BY p.due_date DESC'
);
$stmt->execute([$ypc_id]);
$payments = $stmt->fetchAll();

$outstanding = array_filter($payments, fn($p) => $p['status'] !== 'paid');
$total_outstanding = (float) array_sum(array_column(array_values($outstanding), 'amount'));

jsonResponse([
    'outstanding_amount' => $total_outstanding,
    'account_status'     => $total_outstanding > 0 ? 'outstanding' : 'paid',
    'payments'           => $payments,
]);

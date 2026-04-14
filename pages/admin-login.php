<?php
// ============================================================
//  Admin Login
//  POST { username, password }
//  Returns { success: true, admin: { username, name, role } }
// ============================================================
require_once __DIR__ . '/config.php';

$input    = json_decode(file_get_contents('php://input'), true) ?? [];
$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if (!$username || !$password) {
    jsonResponse(['success' => false, 'error' => 'Username and password are required'], 400);
}

try {
    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM admins WHERE username = ? AND is_active = 1 LIMIT 1');
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    if (!$admin || !password_verify($password, $admin['password_hash'])) {
        jsonResponse(['success' => false, 'error' => 'Invalid admin credentials'], 401);
    }

    jsonResponse([
        'success' => true,
        'admin'   => [
            'username' => $admin['username'],
            'name'     => $admin['full_name'],
            'role'     => $admin['role'],
        ],
    ]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error'], 500);
}

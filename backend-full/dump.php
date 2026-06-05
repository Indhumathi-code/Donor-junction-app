<?php
require_once 'db_config.php';
$res = [];
try {
    $stmt = $pdo->prepare("SELECT * FROM users");
    $stmt->execute();
    $res['users'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $res['users_error'] = $e->getMessage();
}

try {
    $stmt = $pdo->prepare("SELECT * FROM unified_messages ORDER BY id DESC LIMIT 20");
    $stmt->execute();
    $res['messages'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $res['messages_error'] = $e->getMessage();
}

try {
    $stmt = $pdo->prepare("SELECT * FROM chat_threads ORDER BY id DESC");
    $stmt->execute();
    $res['threads'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $res['threads_error'] = $e->getMessage();
}

echo json_encode($res, JSON_PRETTY_PRINT);
?>



<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

try {
    $stmt = $pdo->query("SELECT id, org_name AS orgName, admin_name AS adminName, email, phone, status, joined_date AS joinedDate FROM active_admins ORDER BY id DESC");
    $admins = $stmt->fetchAll();

    echo json_encode(["status" => "success", "admins" => $admins]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

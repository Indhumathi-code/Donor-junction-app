<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid request body"]);
    exit();
}

$id = isset($data['id']) ? $data['id'] : '';
$status = isset($data['status']) ? $data['status'] : ''; // 'approved' or 'declined'

if (empty($id) || empty($status)) {
    echo json_encode(["status" => "error", "message" => "Missing organization id or status"]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE organizations SET status = :status WHERE id = :id");
    $stmt->execute(['status' => $status, 'id' => $id]);

    echo json_encode(["status" => "success", "message" => "Organization registration " . $status . " successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

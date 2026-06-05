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
$collected = isset($data['collected']) ? (int)$data['collected'] : 0;
$status = isset($data['status']) ? $data['status'] : '';
$status_color = isset($data['status_color']) ? $data['status_color'] : '';
$status_bg = isset($data['status_bg']) ? $data['status_bg'] : '';

if (empty($id)) {
    echo json_encode(["status" => "error", "message" => "Missing campaign id"]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE campaigns SET collected = :collected, status = :status, status_color = :status_color, status_bg = :status_bg WHERE id = :id");
    $stmt->execute([
        'collected' => $collected,
        'status' => $status,
        'status_color' => $status_color,
        'status_bg' => $status_bg,
        'id' => $id
    ]);

    echo json_encode(["status" => "success", "message" => "Campaign progress updated successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

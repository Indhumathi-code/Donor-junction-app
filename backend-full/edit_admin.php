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
$adminName = isset($data['adminName']) ? $data['adminName'] : '';
$orgName = isset($data['orgName']) ? $data['orgName'] : '';
$email = isset($data['email']) ? $data['email'] : '';
$phone = isset($data['phone']) ? $data['phone'] : '';

if (empty($id) || empty($adminName) || empty($orgName) || empty($email) || empty($phone)) {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE active_admins SET admin_name = :admin_name, org_name = :org_name, email = :email, phone = :phone WHERE id = :id");
    $stmt->execute([
        'admin_name' => $adminName,
        'org_name' => $orgName,
        'email' => $email,
        'phone' => $phone,
        'id' => $id
    ]);

    echo json_encode(["status" => "success", "message" => "Admin updated successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

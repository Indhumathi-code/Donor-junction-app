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

$adminName = isset($data['adminName']) ? $data['adminName'] : '';
$orgName = isset($data['orgName']) ? $data['orgName'] : '';
$email = isset($data['email']) ? $data['email'] : '';
$phone = isset($data['phone']) ? $data['phone'] : '';
$status = isset($data['status']) ? $data['status'] : 'Active';
$joinedDate = isset($data['joinedDate']) ? $data['joinedDate'] : date("M d, Y");

if (empty($adminName) || empty($orgName) || empty($email) || empty($phone)) {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    exit();
}

try {
    $stmt = $pdo->prepare("INSERT INTO active_admins (org_name, admin_name, email, phone, status, joined_date) VALUES (:org_name, :admin_name, :email, :phone, :status, :joined_date)");
    $stmt->execute([
        'org_name' => $orgName,
        'admin_name' => $adminName,
        'email' => $email,
        'phone' => $phone,
        'status' => $status,
        'joined_date' => $joinedDate
    ]);

    $newId = $pdo->lastInsertId();

    echo json_encode([
        "status" => "success",
        "message" => "Admin added successfully.",
        "admin" => [
            "id" => $newId,
            "orgName" => $orgName,
            "adminName" => $adminName,
            "email" => $email,
            "phone" => $phone,
            "status" => $status,
            "joinedDate" => $joinedDate
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
  
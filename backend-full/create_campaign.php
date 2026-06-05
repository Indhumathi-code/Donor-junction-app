<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
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
$org_mobile = isset($data['org_mobile']) ? $data['org_mobile'] : '';
$title = isset($data['title']) ? $data['title'] : '';
$date_time = isset($data['date_time']) ? $data['date_time'] : '';
$place = isset($data['place']) ? $data['place'] : '';
$status = isset($data['status']) ? $data['status'] : '';
$status_color = isset($data['status_color']) ? $data['status_color'] : '';
$status_bg = isset($data['status_bg']) ? $data['status_bg'] : '';
$description = isset($data['description']) ? $data['description'] : '';
$collected = isset($data['collected']) ? (int)$data['collected'] : 0;
$target = isset($data['target']) ? (int)$data['target'] : 0;
$image_uri = isset($data['image_uri']) ? $data['image_uri'] : null;

if (empty($id) || empty($org_mobile) || empty($title) || empty($place) || empty($date_time) || empty($status) || empty($target)) {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    exit();
}

try {
    $stmt = $pdo->prepare("INSERT INTO campaigns (id, org_mobile, title, date_time, place, status, status_color, status_bg, description, collected, target, image_uri) 
        VALUES (:id, :org_mobile, :title, :date_time, :place, :status, :status_color, :status_bg, :description, :collected, :target, :image_uri)");
    
    $stmt->execute([
        'id' => $id,
        'org_mobile' => $org_mobile,
        'title' => $title,
        'date_time' => $date_time,
        'place' => $place,
        'status' => $status,
        'status_color' => $status_color,
        'status_bg' => $status_bg,
        'description' => $description,
        'collected' => $collected,
        'target' => $target,
        'image_uri' => $image_uri
    ]);

    echo json_encode(["status" => "success", "message" => "Campaign created successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

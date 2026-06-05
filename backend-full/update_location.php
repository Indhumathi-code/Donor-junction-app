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

$mobile = isset($data['mobile']) ? $data['mobile'] : '';
$latitude = isset($data['latitude']) ? $data['latitude'] : null;
$longitude = isset($data['longitude']) ? $data['longitude'] : null;

if (empty($mobile) || $latitude === null || $longitude === null) {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    exit();
}

$cleaned_mobile = preg_replace('/[\s\-_]/', '', $mobile);

try {
    $stmt = $pdo->prepare("UPDATE organizations SET latitude = :latitude, longitude = :longitude WHERE mobile = :mobile");
    $stmt->execute([
        'latitude' => $latitude,
        'longitude' => $longitude,
        'mobile' => $cleaned_mobile
    ]);

    echo json_encode(["status" => "success", "message" => "Location updated successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

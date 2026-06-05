<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

$mobile = isset($_GET['mobile']) ? $_GET['mobile'] : '';

if (empty($mobile)) {
    echo json_encode(["status" => "error", "message" => "Missing mobile number"]);
    exit();
}

$cleaned_mobile = preg_replace('/[\s\-_]/', '', $mobile);

try {
    // Check database
    $stmt = $pdo->prepare("SELECT * FROM organizations WHERE mobile = :mobile");
    $stmt->execute(['mobile' => $cleaned_mobile]);
    $org = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($org) {
        echo json_encode([
            "status" => "success",
            "organization" => $org
        ]);
    } else {
        // Fallback for default hardcoded admin
        if ($cleaned_mobile === '9840012345') {
            echo json_encode([
                "status" => "success",
                "organization" => [
                    "id" => "9840012345",
                    "name" => "Apollo Hospital (Chennai)",
                    "category" => "Hospital",
                    "license" => "TN-MED-2024-00872",
                    "mobile" => "9840012345",
                    "city" => "Chennai",
                    "address" => "Apollo Hospital Main Auditorium",
                    "pincode" => "600006",
                    "status" => "approved",
                    "doc_uri" => null,
                    "doc_type" => "image",
                    "doc_name" => null
                ]
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Organization not found"]);
        }
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

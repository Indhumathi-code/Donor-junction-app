<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

$rawBody = file_get_contents("php://input");
$data = json_decode($rawBody, true);
if (!$data && !empty($rawBody)) {
    parse_str($rawBody, $data);
}

if (!is_array($data)) {
    echo json_encode(["status" => "error", "message" => "Invalid request body"]);
    exit();
}

$mobile = isset($data['mobile']) ? trim($data['mobile']) : '';

if (empty($mobile)) {
    echo json_encode(["status" => "error", "message" => "Missing mobile number"]);
    exit();
}

// Clean mobile number (strip non-digit characters)
$cleaned_mobile = preg_replace('/[^0-9]/', '', $mobile);
if (strlen($cleaned_mobile) > 10 && substr($cleaned_mobile, 0, 2) === '91') {
    $cleaned_mobile = substr($cleaned_mobile, 2);
}

if (strlen($cleaned_mobile) !== 10) {
    echo json_encode(["status" => "error", "message" => "Invalid mobile number format"]);
    exit();
}

try {
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS otps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            mobile VARCHAR(20) NOT NULL,
            otp VARCHAR(6) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );

    // Helper function to generate and save OTP
    function generateAndSaveOTP($pdo, $mobile) {
        $otp = strval(rand(1000, 9999));
        
        // Remove any existing OTP for this mobile number to keep database clean
        $del_stmt = $pdo->prepare("DELETE FROM otps WHERE mobile = :mobile");
        $del_stmt->execute(['mobile' => $mobile]);
        
        // Insert the new OTP
        $ins_stmt = $pdo->prepare("INSERT INTO otps (mobile, otp) VALUES (:mobile, :otp)");
        $ins_stmt->execute(['mobile' => $mobile, 'otp' => $otp]);
        
        return $otp;
    }

    // 1. Hardcoded admin check
    if ($cleaned_mobile === '9840012345') {
        $otp = generateAndSaveOTP($pdo, $cleaned_mobile);
        echo json_encode([
            "status" => "success",
            "exists" => true,
            "org_status" => "approved",
            "otp" => $otp,
            "org_details" => [
                "id" => "9840012345",
                "name" => "Apollo Hospital (Chennai)",
                "category" => "Hospital",
                "city" => "Chennai"
            ]
        ]);
        exit();
    }

    // 2. Database organization check
    $stmt = $pdo->prepare("SELECT * FROM organizations WHERE mobile = :mobile");
    $stmt->execute(['mobile' => $cleaned_mobile]);
    $org = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($org) {
        $otp = null;
        if (isset($org['status']) && $org['status'] === 'approved') {
            $otp = generateAndSaveOTP($pdo, $cleaned_mobile);
        }
        
        echo json_encode([
            "status" => "success",
            "exists" => true,
            "org_status" => $org['status'] ?? 'pending',
            "otp" => $otp,
            "org_details" => [
                "id" => $org['id'],
                "name" => $org['name'],
                "category" => $org['category'],
                "city" => $org['city'] ?? ''
            ]
        ]);
    } else {
        echo json_encode([
            "status" => "success",
            "exists" => false
        ]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

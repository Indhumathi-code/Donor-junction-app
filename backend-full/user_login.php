<?php
require_once 'db_config.php';

function cleanMobile($mobile) {
    $cleaned = preg_replace('/[^0-9]/', '', $mobile);
    if (strlen($cleaned) == 12 && substr($cleaned, 0, 2) === '91') {
        return substr($cleaned, 2);
    }
    if (strlen($cleaned) > 10) {
        return substr($cleaned, -10);
    }
    return $cleaned;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = "SELECT * FROM blood_posts ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $posts]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->mobile)) {
    $mobile = cleanMobile($data->mobile);

    // Check if this mobile number is already registered
    $userQuery = "SELECT id FROM users WHERE mobile = :mobile LIMIT 1";
    $userStmt = $conn->prepare($userQuery);
    $userStmt->bindParam(':mobile', $mobile);
    $userStmt->execute();
    $userExists = $userStmt->fetch(PDO::FETCH_ASSOC) ? true : false;

    if (!$userExists) {
        echo json_encode([
            "status" => "success",
            "message" => "New user, please register",
            "exists" => false
        ]);
        exit();
    }

    // 1. Generate a random 4-digit OTP
    $otp = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);

    // 2. Save OTP to database
    try {
        // Delete old OTP entries for this mobile
        $deleteQuery = "DELETE FROM otps WHERE mobile = :mobile";
        $deleteStmt = $conn->prepare($deleteQuery);
        $deleteStmt->bindParam(':mobile', $mobile);
        $deleteStmt->execute();

        // Insert new OTP
        $query = "INSERT INTO otps (mobile, otp) VALUES (:mobile, :otp)";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':mobile', $mobile);
        $stmt->bindParam(':otp', $otp);
        $stmt->execute();

        echo json_encode([
            "status" => "success",
            "message" => "OTP generated and saved successfully",
            "otp" => $otp,
            "exists" => true
        ]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else if (!empty($data->scheduled_date)) {
    echo json_encode([
        "status" => "success",
        "message" => "Donation scheduled successfully",
        "donation_id" => rand(1000, 9999)
    ]);
    exit();
} else {
    echo json_encode(["status" => "error", "message" => "Mobile number is required"]);
}
?>

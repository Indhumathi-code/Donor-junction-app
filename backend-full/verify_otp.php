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

// Auto-create users table if not exists
$tableQuery = "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    mobile VARCHAR(50) UNIQUE,
    blood_group VARCHAR(10),
    dob VARCHAR(50),
    gender VARCHAR(50),
    last_donation_date VARCHAR(50),
    city VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";
$conn->exec($tableQuery);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->mobile) && !empty($data->otp)) {
    $mobile = cleanMobile($data->mobile);
    $input_otp = trim($data->otp);

    // 1. Verify the OTP from the 'otps' table (get the latest one)
    $otp_query = "SELECT otp FROM otps WHERE mobile = :mobile OR mobile = :raw_mobile ORDER BY created_at DESC LIMIT 1";
    $otp_stmt = $conn->prepare($otp_query);
    $raw_mobile = preg_replace('/[^0-9]/', '', $data->mobile);
    $otp_stmt->bindParam(':mobile', $mobile);
    $otp_stmt->bindParam(':raw_mobile', $raw_mobile);
    $otp_stmt->execute();
    $otp_record = $otp_stmt->fetch(PDO::FETCH_ASSOC);

    if ($otp_record && $otp_record['otp'] === $input_otp) {
        // Delete this OTP after successful verification (cannot be reused)
        $deleteQuery = "DELETE FROM otps WHERE mobile = :mobile AND otp = :otp";
        $deleteStmt = $conn->prepare($deleteQuery);
        $deleteStmt->bindParam(':mobile', $mobile);
        $deleteStmt->bindParam(':otp', $input_otp);
        $deleteStmt->execute();

        // 2. OTP is valid, now check if user exists
        $query = "SELECT * FROM users WHERE mobile = :mobile";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':mobile', $mobile);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            echo json_encode([
                "status" => "success",
                "is_registered" => true,
                "user" => $user
            ]);
        } else {
            echo json_encode([
                "status" => "success",
                "is_registered" => false,
                "message" => "New user, please register"
            ]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid or expired OTP"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Mobile and OTP are required"]);
}
?>

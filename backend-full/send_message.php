<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

// Get request body
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid request body"]);
    exit();
}

$donor_id = isset($data['donor_id']) ? $data['donor_id'] : '';
$donor_phone = isset($data['donor_phone']) ? $data['donor_phone'] : '';
$org_mobile = isset($data['org_mobile']) ? $data['org_mobile'] : '';
$message_text = isset($data['message_text']) ? $data['message_text'] : '';
$is_me = isset($data['is_me']) ? (int)$data['is_me'] : 1;

if (empty($donor_id) && empty($donor_phone)) {
    echo json_encode(["status" => "error", "message" => "Missing required fields: donor_id or donor_phone"]);
    exit();
}

if (empty($org_mobile) || empty($message_text)) {
    echo json_encode(["status" => "error", "message" => "Missing required fields: org_mobile, message_text"]);
    exit();
}

try {
    // Ensure the unified chat table exists
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS unified_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sender_id VARCHAR(50),
            sender_name VARCHAR(100),
            sender_type VARCHAR(20),
            receiver_id VARCHAR(50),
            receiver_name VARCHAR(100),
            receiver_type VARCHAR(20),
            message TEXT,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );

    // Add column if it doesn't exist (failsafe for old db schemas)
    try {
        $pdo->exec("ALTER TABLE unified_messages ADD COLUMN is_read TINYINT(1) DEFAULT 0");
    } catch (PDOException $e) {
        // Suppress if column already exists
    }

    // Support donor phone fallback if donor_id is not provided
    if (empty($donor_id) && !empty($donor_phone)) {
        $donor_id = $donor_phone;
    }

    // Determine sender and receiver
    if ($is_me) {
        $sender_id = $org_mobile;
        $sender_type = 'hospital';
        $receiver_id = $donor_id;
        $receiver_type = 'user';
    } else {
        $sender_id = $donor_id;
        $sender_type = 'user';
        $receiver_id = $org_mobile;
        $receiver_type = 'hospital';
    }

    // Attempt to get names
    $sender_name = $sender_id;
    $receiver_name = $receiver_id;

    if ($is_me) {
        $stmtOrg = $pdo->prepare("SELECT name FROM organizations WHERE mobile = :mobile");
        $stmtOrg->execute(['mobile' => $org_mobile]);
        if ($org = $stmtOrg->fetch(PDO::FETCH_ASSOC)) {
            $sender_name = $org['name'];
        }

        if (!empty($donor_id)) {
            $stmtUser = $pdo->prepare("SELECT name FROM users WHERE mobile = :mobile OR id = :id");
            $stmtUser->execute(['mobile' => $donor_id, 'id' => $donor_id]);
            if ($user = $stmtUser->fetch(PDO::FETCH_ASSOC)) {
                $receiver_name = $user['name'];
            }
        }
    } else {
        $stmtOrg = $pdo->prepare("SELECT name FROM organizations WHERE mobile = :mobile");
        $stmtOrg->execute(['mobile' => $org_mobile]);
        if ($org = $stmtOrg->fetch(PDO::FETCH_ASSOC)) {
            $receiver_name = $org['name'];
        }

        if (!empty($donor_id)) {
            $stmtUser = $pdo->prepare("SELECT name FROM users WHERE mobile = :mobile OR id = :id");
            $stmtUser->execute(['mobile' => $donor_id, 'id' => $donor_id]);
            if ($user = $stmtUser->fetch(PDO::FETCH_ASSOC)) {
                $sender_name = $user['name'];
            }
        }
    }

    $stmt = $pdo->prepare("INSERT INTO unified_messages (sender_id, sender_name, sender_type, receiver_id, receiver_name, receiver_type, message) 
                           VALUES (:sender_id, :sender_name, :sender_type, :receiver_id, :receiver_name, :receiver_type, :message)");
    $stmt->execute([
        'sender_id' => $sender_id,
        'sender_name' => $sender_name,
        'sender_type' => $sender_type,
        'receiver_id' => $receiver_id,
        'receiver_name' => $receiver_name,
        'receiver_type' => $receiver_type,
        'message' => $message_text
    ]);

    $message_id = $pdo->lastInsertId();

    echo json_encode([
        "status" => "success",
        "message" => "Message sent successfully",
        "data" => [
            "id" => (int)$message_id,
            "donor_id" => $donor_id,
            "org_mobile" => $org_mobile,
            "text" => $message_text,
            "me" => (bool)$is_me,
            "created_at" => date('Y-m-d H:i:s')
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

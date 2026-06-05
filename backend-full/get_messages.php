<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

$donor_id = isset($_GET['donor_id']) ? $_GET['donor_id'] : '';
$donor_phone = isset($_GET['donor_phone']) ? $_GET['donor_phone'] : '';
$org_mobile = isset($_GET['org_mobile']) ? $_GET['org_mobile'] : '';

if (empty($donor_id) && empty($donor_phone)) {
    echo json_encode(["status" => "error", "message" => "Missing donor_id or donor_phone"]);
    exit();
}

if (empty($org_mobile)) {
    echo json_encode(["status" => "error", "message" => "Missing org_mobile"]);
    exit();
}

$participant = !empty($donor_id) ? $donor_id : $donor_phone;

try {
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

    // Get org name
    $stmtOrg = $pdo->prepare("SELECT name FROM organizations WHERE mobile = :mobile");
    $stmtOrg->execute(['mobile' => $org_mobile]);
    $org_name = ($org = $stmtOrg->fetch(PDO::FETCH_ASSOC)) ? $org['name'] : $org_mobile;

    // Mark incoming messages as read
    $stmtRead = $pdo->prepare("UPDATE unified_messages SET is_read = 1 
                                WHERE sender_id = :participant AND (receiver_id = :org_mobile OR receiver_name = :org_name) AND is_read = 0");
    $stmtRead->execute(['participant' => $participant, 'org_mobile' => $org_mobile, 'org_name' => $org_name]);

    $stmt = $pdo->prepare("SELECT * FROM unified_messages 
                           WHERE (sender_id = :participant AND (receiver_id = :org_mobile OR receiver_id = :org_name OR receiver_name = :org_name)) 
                           OR (receiver_id = :participant AND (sender_id = :org_mobile OR sender_id = :org_name OR sender_name = :org_name)) 
                           ORDER BY created_at ASC");
    $stmt->execute(['participant' => $participant, 'org_mobile' => $org_mobile, 'org_name' => $org_name]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Map fields for client compatibility
    $formatted = [];
    foreach ($messages as $msg) {
        // me = 1 if sent by org, me = 0 if sent by donor
        $is_me = ($msg['sender_id'] == $org_mobile || $msg['sender_name'] == $org_name) ? 1 : 0;
        $formatted[] = [
            "id" => (int)$msg['id'],
            "text" => $msg['message'],
            "me" => (bool)$is_me,
            "created_at" => $msg['created_at']
        ];
    }

    echo json_encode(["status" => "success", "messages" => $formatted]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

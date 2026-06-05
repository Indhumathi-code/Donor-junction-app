<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

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

// Create table if not exists
try {
    $conn->exec("CREATE TABLE IF NOT EXISTS chat_threads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_phone VARCHAR(20) NOT NULL,
        partner_name VARCHAR(100) NOT NULL,
        last_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_chat (user_phone, partner_name)
    )");
} catch (PDOException $e) {
    // Ignore error
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user_phone = cleanMobile($_GET['user_phone'] ?? '');
    if (empty($user_phone)) {
        echo json_encode(['status' => 'error', 'message' => 'User phone required']);
        exit;
    }

    try {
        // Query unified_messages for all unique chat partners (both sent and received) with unread count!
        $query = "
            SELECT m1.*,
                CASE WHEN m1.sender_id = :user_phone THEN m1.receiver_id ELSE m1.sender_id END AS partner_phone,
                CASE WHEN m1.sender_id = :user_phone THEN m1.receiver_name ELSE m1.sender_name END AS partner_name,
                CASE WHEN m1.sender_id = :user_phone THEN m1.receiver_type ELSE m1.sender_type END AS partner_type,
                (SELECT COUNT(*) FROM unified_messages 
                 WHERE sender_id = (CASE WHEN m1.sender_id = :user_phone_sub1 THEN m1.receiver_id ELSE m1.sender_id END) 
                   AND receiver_id = :user_phone_sub2 
                   AND is_read = 0) AS unread_count
            FROM unified_messages m1
            INNER JOIN (
                SELECT 
                    CASE WHEN sender_id = :user_phone_group THEN receiver_id ELSE sender_id END AS partner_id,
                    MAX(created_at) AS max_date
                FROM unified_messages
                WHERE sender_id = :user_phone_where OR receiver_id = :user_phone_or
                GROUP BY partner_id
            ) m2 ON ((m1.sender_id = :user_phone_on1 AND m1.receiver_id = m2.partner_id) OR (m1.receiver_id = :user_phone_on2 AND m1.sender_id = m2.partner_id))
                AND m1.created_at = m2.max_date
            ORDER BY m1.created_at DESC
        ";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_phone', $user_phone);
        $stmt->bindParam(':user_phone_sub1', $user_phone);
        $stmt->bindParam(':user_phone_sub2', $user_phone);
        $stmt->bindParam(':user_phone_group', $user_phone);
        $stmt->bindParam(':user_phone_where', $user_phone);
        $stmt->bindParam(':user_phone_or', $user_phone);
        $stmt->bindParam(':user_phone_on1', $user_phone);
        $stmt->bindParam(':user_phone_on2', $user_phone);
        $stmt->execute();
        $db_threads = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $threads = [];
        foreach ($db_threads as $t) {
            $threads[] = [
                'id' => $t['id'].'',
                'partner_name' => !empty($t['partner_name']) ? $t['partner_name'] : $t['partner_phone'],
                'partner_phone' => cleanMobile($t['partner_phone']),
                'partner_type' => $t['partner_type'],
                'last_message' => $t['message'],
                'unread' => (int)$t['unread_count'],
                'created_at' => $t['created_at']
            ];
        }
        
        // Add hardcoded hospitals if list is empty or just for demo
        if (empty($threads)) {
            $threads = [
                ['id' => 'h1', 'partner_name' => 'Apollo Hospital', 'partner_phone' => 'Apollo Hospital', 'partner_type' => 'hospital', 'last_message' => 'Hello! Welcome to Apollo Hospital.', 'created_at' => date('Y-m-d H:i:s')],
                ['id' => 'h2', 'partner_name' => 'Vadamalayan Hospital', 'partner_phone' => 'Vadamalayan Hospital', 'partner_type' => 'hospital', 'last_message' => 'Hello! Welcome to Vadamalayan Hospital.', 'created_at' => date('Y-m-d H:i:s')],
                ['id' => 'h3', 'partner_name' => 'Meenakshi Mission', 'partner_phone' => 'Meenakshi Mission', 'partner_type' => 'hospital', 'last_message' => 'Hello! Welcome to Meenakshi Mission.', 'created_at' => date('Y-m-d H:i:s')]
            ];
        }
        
        echo json_encode(['status' => 'success', 'data' => $threads]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if (empty($data->user_phone) || empty($data->partner_name)) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        exit;
    }

    $user_phone = cleanMobile($data->user_phone);
    $last_message = $data->last_message ?? 'Chat started';

    try {
        // Insert or update on duplicate key
        $stmt = $conn->prepare("INSERT INTO chat_threads (user_phone, partner_name, last_message) 
                                VALUES (:user_phone, :partner_name, :last_message)
                                ON DUPLICATE KEY UPDATE last_message = :last_message_update, created_at = CURRENT_TIMESTAMP");
        $stmt->bindParam(':user_phone', $user_phone);
        $stmt->bindParam(':partner_name', $data->partner_name);
        $stmt->bindParam(':last_message', $last_message);
        $stmt->bindParam(':last_message_update', $last_message);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Thread saved']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to save thread']);
        }
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
?>

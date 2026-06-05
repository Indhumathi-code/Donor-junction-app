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
    $conn->exec("CREATE TABLE IF NOT EXISTS unified_messages (
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
    )");
} catch (PDOException $e) {
    // Ignore error
}
try {
    $conn->exec("ALTER TABLE unified_messages ADD COLUMN is_read TINYINT(1) DEFAULT 0");
} catch (PDOException $e) {
    // Ignore
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user_phone = cleanMobile($_GET['user_phone'] ?? '');
    $partner_mobile = cleanMobile($_GET['partner_mobile'] ?? '');
    $partner_name = $_GET['partner_name'] ?? '';
    
    if (empty($user_phone)) {
        echo json_encode(['status' => 'error', 'message' => 'User phone required']);
        exit;
    }

    try {
        if (!empty($partner_mobile)) {
            // Mark as read
            $stmtRead = $conn->prepare("UPDATE unified_messages SET is_read = 1 
                                        WHERE sender_id = :partner_mobile AND receiver_id = :user_phone AND is_read = 0");
            $stmtRead->bindParam(':partner_mobile', $partner_mobile);
            $stmtRead->bindParam(':user_phone', $user_phone);
            $stmtRead->execute();

            // Direct query by phone numbers (robust!)
            $stmt = $conn->prepare("SELECT * FROM unified_messages 
                                    WHERE (sender_id = :user_phone AND receiver_id = :partner_mobile) 
                                    OR (receiver_id = :user_phone AND sender_id = :partner_mobile) 
                                    ORDER BY created_at ASC");
            $stmt->bindParam(':user_phone', $user_phone);
            $stmt->bindParam(':partner_mobile', $partner_mobile);
        } else {
            // Resolve partner_name to mobile (use LIKE to be flexible)
            $stmtOrg = $conn->prepare("SELECT mobile, name FROM organizations WHERE name LIKE :name LIMIT 1");
            $searchTerm = '%' . $partner_name . '%';
            $stmtOrg->bindParam(':name', $searchTerm);
            $stmtOrg->execute();
            if ($org = $stmtOrg->fetch(PDO::FETCH_ASSOC)) {
                $partner_mobile = cleanMobile($org['mobile']);
                $db_partner_name = $org['name'];
            } else {
                // Check if it's a user in the users table!
                $stmtUser = $conn->prepare("SELECT mobile, name FROM users WHERE name LIKE :name LIMIT 1");
                $searchTerm = '%' . $partner_name . '%';
                $stmtUser->bindParam(':name', $searchTerm);
                $stmtUser->execute();
                if ($u = $stmtUser->fetch(PDO::FETCH_ASSOC)) {
                    $partner_mobile = cleanMobile($u['mobile']);
                    $db_partner_name = $u['name'];
                } else {
                    $partner_mobile = cleanMobile($partner_name);
                    $db_partner_name = $partner_name;
                }
            }

            // Mark as read
            $stmtRead = $conn->prepare("UPDATE unified_messages SET is_read = 1 
                                        WHERE (sender_name = :partner_name OR sender_name = :db_partner_name OR sender_id = :partner_mobile) 
                                        AND receiver_id = :user_phone AND is_read = 0");
            $stmtRead->bindParam(':partner_name', $partner_name);
            $stmtRead->bindParam(':db_partner_name', $db_partner_name);
            $stmtRead->bindParam(':partner_mobile', $partner_mobile);
            $stmtRead->bindParam(':user_phone', $user_phone);
            $stmtRead->execute();

            // Query the unified_messages table using both name and mobile
            $stmt = $conn->prepare("SELECT * FROM unified_messages 
                                    WHERE (sender_id = :user_phone AND (receiver_name = :partner_name OR receiver_name = :db_partner_name OR receiver_id = :partner_mobile)) 
                                    OR (receiver_id = :user_phone AND (sender_name = :partner_name OR sender_name = :db_partner_name OR sender_id = :partner_mobile)) 
                                    ORDER BY created_at ASC");
            $stmt->bindParam(':user_phone', $user_phone);
            $stmt->bindParam(':partner_name', $partner_name);
            $stmt->bindParam(':db_partner_name', $db_partner_name);
            $stmt->bindParam(':partner_mobile', $partner_mobile);
        }
        $stmt->execute();
        $unified = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Map back to expected structure
        $messages = [];
        foreach ($unified as $msg) {
            $sender = ($msg['sender_id'] == $user_phone) ? 'user' : 'partner';
            $messages[] = [
                'id' => $msg['id'],
                'user_phone' => $user_phone,
                'partner_name' => $partner_name,
                'sender' => $sender,
                'message' => $msg['message'],
                'created_at' => $msg['created_at']
            ];
        }
        
        echo json_encode(['status' => 'success', 'data' => $messages]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    // Handle delete action
    if (isset($data->action) && $data->action === 'delete') {
        $user_phone = cleanMobile($data->user_phone ?? '');
        $partner_mobile = cleanMobile($data->partner_mobile ?? '');
        $partner_name = $data->partner_name ?? '';
        
        if (empty($user_phone)) {
            echo json_encode(['status' => 'error', 'message' => 'User phone required']);
            exit;
        }

        try {
            if (!empty($partner_mobile)) {
                $stmt = $conn->prepare("DELETE FROM unified_messages 
                                        WHERE (sender_id = :user_phone AND receiver_id = :partner_mobile) 
                                        OR (receiver_id = :user_phone AND sender_id = :partner_mobile)");
                $stmt->bindParam(':user_phone', $user_phone);
                $stmt->bindParam(':partner_mobile', $partner_mobile);
            } else {
                $stmt = $conn->prepare("DELETE FROM unified_messages 
                                        WHERE (sender_id = :user_phone AND receiver_name = :partner_name) 
                                        OR (receiver_id = :user_phone AND sender_name = :partner_name)");
                $stmt->bindParam(':user_phone', $user_phone);
                $stmt->bindParam(':partner_name', $partner_name);
            }
            
            $stmt->execute();
            $deleted = $stmt->rowCount();
            
            // Delete thread as well (legacy)
            if (!empty($partner_name)) {
                $stmt2 = $conn->prepare("DELETE FROM chat_threads WHERE partner_name = :partner_name");
                $stmt2->bindParam(':partner_name', $partner_name);
                $stmt2->execute();
            }

            echo json_encode(['status' => 'success', 'message' => 'Chat deleted', 'count' => $deleted]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }

    if (empty($data->user_phone) || empty($data->message)) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        exit;
    }

    $user_phone = cleanMobile($data->user_phone);
    $partner_mobile = cleanMobile($data->partner_mobile ?? '');
    $partner_name = $data->partner_name ?? '';
    $partner_type = $data->partner_type ?? 'user';
    $message = $data->message;

    // Resolve partner details if mobile is missing
    if (empty($partner_mobile) && !empty($partner_name)) {
        $stmtOrg = $conn->prepare("SELECT mobile, name FROM organizations WHERE name LIKE :name LIMIT 1");
        $searchTerm = '%' . $partner_name . '%';
        $stmtOrg->bindParam(':name', $searchTerm);
        $stmtOrg->execute();
        if ($org = $stmtOrg->fetch(PDO::FETCH_ASSOC)) {
            $partner_mobile = cleanMobile($org['mobile']);
            $partner_type = 'hospital';
            $partner_name = $org['name'];
        } else {
            // Check if it's a user in the users table!
            $stmtUser = $conn->prepare("SELECT mobile, name FROM users WHERE name LIKE :name LIMIT 1");
            $searchTerm = '%' . $partner_name . '%';
            $stmtUser->bindParam(':name', $searchTerm);
            $stmtUser->execute();
            if ($u = $stmtUser->fetch(PDO::FETCH_ASSOC)) {
                $partner_mobile = cleanMobile($u['mobile']);
                $partner_type = 'user';
                $partner_name = $u['name'];
            } else {
                $partner_mobile = cleanMobile($partner_name);
                $partner_type = 'user';
            }
        }
    }

    try {
        // Resolve sender_name from users
        $sender_name = $user_phone;
        $stmtUser = $conn->prepare("SELECT name FROM users WHERE mobile = :mobile LIMIT 1");
        $stmtUser->bindParam(':mobile', $user_phone);
        $stmtUser->execute();
        if ($u = $stmtUser->fetch(PDO::FETCH_ASSOC)) {
            $sender_name = $u['name'];
        }

        // Resolve receiver name
        $receiver_name = $partner_name;
        if (empty($receiver_name)) {
            if ($partner_type === 'hospital') {
                $stmtOrg = $conn->prepare("SELECT name FROM organizations WHERE mobile = :mobile LIMIT 1");
                $stmtOrg->bindParam(':mobile', $partner_mobile);
                $stmtOrg->execute();
                if ($o = $stmtOrg->fetch(PDO::FETCH_ASSOC)) {
                    $receiver_name = $o['name'];
                }
            } else {
                $stmtUser2 = $conn->prepare("SELECT name FROM users WHERE mobile = :mobile LIMIT 1");
                $stmtUser2->bindParam(':mobile', $partner_mobile);
                $stmtUser2->execute();
                if ($u2 = $stmtUser2->fetch(PDO::FETCH_ASSOC)) {
                    $receiver_name = $u2['name'];
                }
            }
        }
        if (empty($receiver_name)) {
            $receiver_name = $partner_mobile;
        }

        $sender_type = 'user'; // donor app always sends as user

        $stmt = $conn->prepare("INSERT INTO unified_messages 
            (sender_id, sender_name, sender_type, receiver_id, receiver_name, receiver_type, message) 
            VALUES (:sender_id, :sender_name, :sender_type, :receiver_id, :receiver_name, :receiver_type, :message)");
            
        $stmt->bindParam(':sender_id', $user_phone);
        $stmt->bindParam(':sender_name', $sender_name);
        $stmt->bindParam(':sender_type', $sender_type);
        $stmt->bindParam(':receiver_id', $partner_mobile);
        $stmt->bindParam(':receiver_name', $receiver_name);
        $stmt->bindParam(':receiver_type', $partner_type);
        $stmt->bindParam(':message', $message);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Message saved']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to save message']);
        }
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
?>

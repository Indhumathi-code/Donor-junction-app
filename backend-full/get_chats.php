<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

$org_mobile = isset($_GET['org_mobile']) ? $_GET['org_mobile'] : '';

if (empty($org_mobile)) {
    echo json_encode(["status" => "error", "message" => "Missing organization mobile number"]);
    exit();
}

$cleaned_mobile = preg_replace('/[\s\-_]/', '', $org_mobile);

try {
    // Ensure the unified messages table exists
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

    // Fetch the latest message per unique donor with this org
    $query = "
        SELECT m1.*,
            CASE WHEN m1.sender_id = :org_mobile THEN m1.receiver_id ELSE m1.sender_id END AS donor_id,
            CASE WHEN m1.sender_id = :org_mobile THEN m1.receiver_name ELSE m1.sender_name END AS donor_name,
            (SELECT COUNT(*) FROM unified_messages 
             WHERE sender_id = (CASE WHEN m1.sender_id = :org_mobile_sub1 THEN m1.receiver_id ELSE m1.sender_id END) 
               AND receiver_id = :org_mobile_sub2 
               AND is_read = 0) AS unread_count
        FROM unified_messages m1
        INNER JOIN (
            SELECT CASE WHEN sender_id = :org_mobile THEN receiver_id ELSE sender_id END AS donor_id,
                MAX(created_at) AS max_date
            FROM unified_messages
            WHERE sender_id = :org_mobile OR receiver_id = :org_mobile
            GROUP BY donor_id
        ) m2 ON ((m1.sender_id = :org_mobile AND m1.receiver_id = m2.donor_id) OR (m1.receiver_id = :org_mobile AND m1.sender_id = m2.donor_id))
            AND m1.created_at = m2.max_date
        ORDER BY m1.created_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([
        'org_mobile' => $cleaned_mobile,
        'org_mobile_sub1' => $cleaned_mobile,
        'org_mobile_sub2' => $cleaned_mobile
    ]);
    $last_messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Map donor profiles (we can map from a mock list of donors or predefined IDs)
    $donors_map = [
        '1' => ['name' => 'Ravi Kumar', 'initials' => 'RK', 'bg' => '#ffeaea', 'text' => '#A32D2D', 'group' => 'A+', 'dist' => '2.3 km', 'status' => 'Eligible'],
        '2' => ['name' => 'Siva Priya', 'initials' => 'SP', 'bg' => '#eaf3de', 'text' => '#27500A', 'group' => 'A+', 'dist' => '4.1 km', 'status' => 'Eligible'],
        '3' => ['name' => 'Mohammed Rafiq', 'initials' => 'MR', 'bg' => '#e6f1fb', 'text' => '#0C447C', 'group' => 'O-', 'dist' => '5.6 km', 'status' => 'Eligible'],
        '4' => ['name' => 'Anitha K.', 'initials' => 'AK', 'bg' => '#faeeda', 'text' => '#633806', 'group' => 'B+', 'dist' => '8.9 km', 'status' => 'Eligible']
    ];

    $chats = [];
    foreach ($last_messages as $msg) {
        $d_id = $msg['donor_id'];
        $donor_name = !empty($msg['donor_name']) ? $msg['donor_name'] : ('Donor #' . $d_id);
        $donor_info = isset($donors_map[$d_id]) ? $donors_map[$d_id] : [
            'name' => $donor_name,
            'initials' => strtoupper(substr($donor_name, 0, 2)),
            'bg' => '#EEEDFE',
            'text' => '#3C3489',
            'group' => 'O+',
            'dist' => '10 km',
            'status' => 'Eligible'
        ];

        // Format relative time (e.g. "2m", "1h")
        $created = strtotime($msg['created_at']);
        $diff = time() - $created;
        if ($diff < 60) {
            $time_str = "now";
        } elseif ($diff < 3600) {
            $time_str = round($diff / 60) . "m";
        } elseif ($diff < 86400) {
            $time_str = round($diff / 3600) . "h";
        } else {
            $time_str = date("M d", $created);
        }

        $chats[] = [
            "id" => (string)$d_id,
            "initials" => $donor_info['initials'],
            "name" => $donor_info['name'],
            "lastMessage" => $msg['message'],
            "time" => $time_str,
            "avatarBg" => $donor_info['bg'],
            "avatarColor" => $donor_info['text'],
            "unread" => (int)$msg['unread_count'],
            "donor" => [
                "id" => (string)$d_id,
                "name" => $donor_info['name'],
                "initials" => $donor_info['initials'],
                "bloodGroup" => $donor_info['group'],
                "distance" => $donor_info['dist'],
                "status" => $donor_info['status']
            ]
        ];
    }

    echo json_encode(["status" => "success", "chats" => $chats]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

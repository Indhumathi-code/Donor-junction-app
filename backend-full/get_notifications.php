<?php
require_once 'db_config.php';

$mobile = $_GET['mobile'] ?? '';

// Create notifications table if not exists
$conn->exec("CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_mobile VARCHAR(50),
    sender_mobile VARCHAR(50),
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    blood_group VARCHAR(10),
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Auto-generate notifications from recent blood posts for this user's blood group
if (!empty($mobile)) {
    // Get user blood group
    $userStmt = $conn->prepare("SELECT blood_group, city FROM users WHERE mobile = :mobile LIMIT 1");
    $userStmt->bindParam(':mobile', $mobile);
    $userStmt->execute();
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $userBloodGroup = $user['blood_group'] ?? '';

        // Find recent urgent posts (last 7 days) seeking the user's blood group
        $postsStmt = $conn->prepare("
            SELECT bp.*, u.name as poster_name
            FROM blood_posts bp
            LEFT JOIN users u ON u.mobile = bp.mobile
            WHERE bp.blood_group = :blood_group
              AND bp.mobile != :mobile
              AND bp.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              AND bp.status = 'open'
            ORDER BY bp.created_at DESC
            LIMIT 20
        ");
        $postsStmt->bindParam(':blood_group', $userBloodGroup);
        $postsStmt->bindParam(':mobile', $mobile);
        $postsStmt->execute();
        $recentPosts = $postsStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($recentPosts as $post) {
            // Check if notification already exists for this post
            $checkStmt = $conn->prepare("SELECT id FROM notifications WHERE recipient_mobile = :recipient AND sender_mobile = :sender AND type = 'blood_request' AND title = :title");
            $checkStmt->bindParam(':recipient', $mobile);
            $checkStmt->bindParam(':sender', $post['mobile']);
            $checkStmt->bindParam(':title', $post['title']);
            $checkStmt->execute();

            if ($checkStmt->rowCount() === 0) {
                $urgencyLabel = ($post['type'] === 'urgent') ? '🚨 Urgent: ' : '🩸 ';
                $msg = "Someone near you needs {$post['blood_group']} blood. Location: {$post['location']}";
                $insertStmt = $conn->prepare("INSERT INTO notifications (recipient_mobile, sender_mobile, type, title, message, blood_group) VALUES (:recipient, :sender, 'blood_request', :title, :message, :blood_group)");
                $insertStmt->bindValue(':recipient', $mobile);
                $insertStmt->bindValue(':sender', $post['mobile']);
                $insertStmt->bindValue(':title', $urgencyLabel . $post['title']);
                $insertStmt->bindValue(':message', $msg);
                $insertStmt->bindValue(':blood_group', $post['blood_group']);
                $insertStmt->execute();
            }
        }
    }
}

// Fetch all notifications for this user
$stmt = $conn->prepare("SELECT * FROM notifications WHERE recipient_mobile = :mobile ORDER BY created_at DESC LIMIT 50");
$stmt->bindParam(':mobile', $mobile);
$stmt->execute();
$notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["status" => "success", "data" => $notifications]);
?>

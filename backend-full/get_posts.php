<?php
require_once 'db_config.php';

$query = "CREATE TABLE IF NOT EXISTS blood_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    type VARCHAR(50),
    location VARCHAR(255),
    distance VARCHAR(50),
    description TEXT,
    blood_group VARCHAR(10),
    units_needed VARCHAR(50),
    image VARCHAR(255),
    mobile VARCHAR(50),
    category VARCHAR(50),
    latitude DOUBLE,
    longitude DOUBLE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";
$conn->exec($query);

// Ensure columns exist if table was already created
try {
    $conn->exec("ALTER TABLE blood_posts ADD COLUMN image VARCHAR(255)");
} catch (PDOException $e) {
    // Ignore
}
try {
    $conn->exec("ALTER TABLE blood_posts ADD COLUMN mobile VARCHAR(50)");
} catch (PDOException $e) {
    // Ignore
}
try {
    $conn->exec("ALTER TABLE blood_posts ADD COLUMN category VARCHAR(50)");
} catch (PDOException $e) {
    // Ignore
}
try {
    $conn->exec("ALTER TABLE blood_posts ADD COLUMN status VARCHAR(50) DEFAULT 'open'");
} catch (PDOException $e) {
    // Ignore
}
try {
    $conn->exec("ALTER TABLE blood_posts ADD COLUMN latitude DOUBLE");
} catch (PDOException $e) {
    // Ignore
}
try {
    $conn->exec("ALTER TABLE blood_posts ADD COLUMN longitude DOUBLE");
} catch (PDOException $e) {
    // Ignore
}

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

$mobile = cleanMobile($_GET['mobile'] ?? '');

if (!empty($mobile)) {
    $query = "SELECT p.*, u.name AS author_name, u.profile_image AS author_avatar FROM blood_posts p LEFT JOIN users u ON p.mobile = u.mobile WHERE p.mobile = :mobile ORDER BY p.created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':mobile', $mobile);
} else {
    $query = "SELECT p.*, u.name AS author_name, u.profile_image AS author_avatar FROM blood_posts p LEFT JOIN users u ON p.mobile = u.mobile ORDER BY p.created_at DESC";
    $stmt = $conn->prepare($query);
}

$stmt->execute();
$posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["status" => "success", "data" => $posts]);
?>

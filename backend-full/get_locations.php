<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

try {
    // Retrieve all organizations with their coordinates
    $stmt = $pdo->prepare("SELECT id, name, category, license, mobile, city, address, pincode, latitude, longitude, 'hospital' as type FROM organizations");
    $stmt->execute();
    $organizations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Retrieve all users with their coordinates
    // We check if users table exists first just in case
    try {
        $stmt_users = $pdo->prepare("SELECT id, name, blood_group as category, mobile, city, address, pincode, latitude, longitude, 'user' as type FROM users WHERE latitude IS NOT NULL");
        $stmt_users->execute();
        $users = $stmt_users->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        $users = [];
    }
    
    $all_locations = array_merge($organizations, $users);

    // Format coordinates as floats
    foreach ($all_locations as &$loc) {
        if (isset($loc['latitude']) && $loc['latitude'] !== null) {
            $loc['latitude'] = (float)$loc['latitude'];
        }
        if (isset($loc['longitude']) && $loc['longitude'] !== null) {
            $loc['longitude'] = (float)$loc['longitude'];
        }
    }

    echo json_encode([
        "status" => "success",
        "locations" => $all_locations
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>

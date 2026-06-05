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

try {
    if (!empty($org_mobile)) {
        $stmt = $pdo->prepare("SELECT * FROM campaigns WHERE org_mobile = :org_mobile ORDER BY created_at DESC");
        $stmt->execute(['org_mobile' => $org_mobile]);
    } else {
        $stmt = $pdo->query("SELECT * FROM campaigns ORDER BY created_at DESC");
    }
    $campaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Cast collected and target to integers
    $formatted = [];
    foreach ($campaigns as $camp) {
        $formatted[] = [
            "id" => $camp['id'],
            "org_mobile" => $camp['org_mobile'],
            "title" => $camp['title'],
            "date" => $camp['date_time'],
            "place" => $camp['place'],
            "status" => $camp['status'],
            "statusColor" => $camp['status_color'],
            "statusBg" => $camp['status_bg'],
            "description" => $camp['description'],
            "collected" => (int)$camp['collected'],
            "target" => (int)$camp['target'],
            "imageUri" => $camp['image_uri']
        ];
    }

    echo json_encode(["status" => "success", "campaigns" => $formatted]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

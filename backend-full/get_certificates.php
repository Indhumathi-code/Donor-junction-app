<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once 'db_config.php';

if (isset($_GET['mobile'])) {
    $mobile = $_GET['mobile'];

    try {
        $query = "SELECT * FROM certificates WHERE mobile = :mobile ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':mobile', $mobile);
        $stmt->execute();
        
        $certificates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "status" => "success", 
            "data" => $certificates
        ]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Mobile number is required."]);
}
?>

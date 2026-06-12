<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once 'db_config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->mobile) && !empty($data->title) && !empty($data->issued_by) && !empty($data->date)) {
    
    $image_uri = "";
    
    // Handle base64 image upload
    if (!empty($data->image_base64)) {
        $upload_dir = 'uploads/certificates/';
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        
        $image_parts = explode(";base64,", $data->image_base64);
        if (count($image_parts) == 2) {
            $image_base64 = base64_decode($image_parts[1]);
            $file_name = uniqid() . '.jpg';
            $file_path = $upload_dir . $file_name;
            
            if (file_put_contents($file_path, $image_base64)) {
                // Construct full URL (adjust localhost/ip depending on your setup)
                $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
                $host = $_SERVER['HTTP_HOST'];
                // Assuming backend is at /Donor-junction-app/backend-full/
                $image_uri = $protocol . "://" . $host . "/Donor-junction-app/backend-full/" . $file_path;
            }
        }
    }

    try {
        $query = "INSERT INTO certificates (mobile, title, issued_by, date, image_uri) VALUES (:mobile, :title, :issued_by, :date, :image_uri)";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':mobile', $data->mobile);
        $stmt->bindParam(':title', $data->title);
        $stmt->bindParam(':issued_by', $data->issued_by);
        $stmt->bindParam(':date', $data->date);
        $stmt->bindParam(':image_uri', $image_uri);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "Certificate added successfully."]);
        } else {
            http_response_code(503);
            echo json_encode(["status" => "error", "message" => "Unable to add certificate."]);
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data. mobile, title, issued_by, and date are required."]);
}
?>

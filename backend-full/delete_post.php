<?php
require_once 'db_config.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    $query = "DELETE FROM blood_posts WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id', $data->id);
    
    try {
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Post deleted successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to delete post"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "DB Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
}
?>

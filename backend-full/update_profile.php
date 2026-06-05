<?php
require_once 'db_config.php';

$data = json_decode(file_get_contents("php://input"));

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

if (!empty($data->id)) {
    try {
        try {
            $conn->exec("ALTER TABLE users ADD COLUMN address TEXT");
        } catch (PDOException $e) {}
        
        try {
            $conn->exec("ALTER TABLE users ADD COLUMN profile_image LONGTEXT");
        } catch (PDOException $e) {}

        // Build query dynamically based on what's provided
        $fields = [];
        $params = [];
        
        if (isset($data->name)) { $fields[] = "name = ?"; $params[] = $data->name; }
        if (isset($data->mobile)) { $fields[] = "mobile = ?"; $params[] = cleanMobile($data->mobile); }
        if (isset($data->blood_group)) { $fields[] = "blood_group = ?"; $params[] = $data->blood_group; }
        if (isset($data->dob)) { $fields[] = "dob = ?"; $params[] = $data->dob; }
        if (isset($data->gender)) { $fields[] = "gender = ?"; $params[] = $data->gender; }
        if (isset($data->city)) { $fields[] = "city = ?"; $params[] = $data->city; }
        if (isset($data->address)) { $fields[] = "address = ?"; $params[] = $data->address; }
        if (isset($data->profile_image)) { $fields[] = "profile_image = ?"; $params[] = $data->profile_image; }
        if (isset($data->latitude)) { $fields[] = "latitude = ?"; $params[] = $data->latitude; }
        if (isset($data->longitude)) { $fields[] = "longitude = ?"; $params[] = $data->longitude; }
        
        if (empty($fields)) {
            echo json_encode(["status" => "error", "message" => "No fields to update"]);
            exit();
        }
        
        $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = ?";
        $params[] = $data->id;
        
        $stmt = $conn->prepare($sql);
        $result = $stmt->execute($params);

        if ($result) {
            echo json_encode(["status" => "success", "message" => "Profile updated successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to update profile"]);
        }
    } catch(PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "User ID is required. Please login again."]);
}
?>

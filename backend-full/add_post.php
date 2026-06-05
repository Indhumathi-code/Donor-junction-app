<?php
require_once 'db_config.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);

$data = json_decode(file_get_contents("php://input"));

// Ensure table exists
$tableQuery = "CREATE TABLE IF NOT EXISTS blood_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    type VARCHAR(50),
    location VARCHAR(255),
    distance VARCHAR(50),
    description TEXT,
    blood_group VARCHAR(10),
    units_needed VARCHAR(50),
    mobile VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";
$conn->exec($tableQuery);

// Ensure image column exists
try {
    $conn->exec("ALTER TABLE blood_posts ADD COLUMN image VARCHAR(255)");
} catch (PDOException $e) {
    // Ignore error if column already exists
}

// Ensure mobile column exists
try {
    $conn->exec("ALTER TABLE blood_posts ADD COLUMN mobile VARCHAR(50)");
} catch (PDOException $e) {
    // Ignore error if column already exists
}

// Ensure status column exists
try {
    $conn->exec("ALTER TABLE blood_posts ADD COLUMN status VARCHAR(50) DEFAULT 'open'");
} catch (PDOException $e) {
    // Ignore error if column already exists
}

// Ensure category column exists
try {
    $conn->exec("ALTER TABLE blood_posts ADD COLUMN category VARCHAR(50)");
} catch (PDOException $e) {
    // Ignore error if column already exists
}

// Ensure latitude and longitude columns exist
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

$image_path = '';
if (!empty($data->image_base64)) {
    if (!file_exists('uploads')) {
        mkdir('uploads', 0777, true);
    }
    $img = $data->image_base64;
    $img = str_replace(' ', '+', $img);
    $img_data = base64_decode($img);
    $file_name = 'img_' . time() . '.jpg';
    file_put_contents('uploads/' . $file_name, $img_data);
    $image_path = 'uploads/' . $file_name;
}

if (!empty($data->title) && !empty($data->blood_group) && !empty($data->location)) {
    $query = "INSERT INTO blood_posts (title, type, location, distance, description, blood_group, units_needed, status, image, mobile, category, latitude, longitude) 
              VALUES (:title, :type, :location, :distance, :description, :blood_group, :units_needed, 'open', :image, :mobile, :category, :latitude, :longitude)";
    
    $stmt = $conn->prepare($query);
    
    $type = $data->type ?? 'normal';
    $distance = $data->distance ?? 'Unknown';
    $description = $data->description ?? '';
    $units_needed = $data->units_needed ?? '1 unit';
    $mobile = cleanMobile($data->mobile ?? '');
    $category = $data->category ?? 'donor';
    $latitude = $data->latitude ?? null;
    $longitude = $data->longitude ?? null;
    
    $stmt->bindParam(':title', $data->title);
    $stmt->bindParam(':type', $type);
    $stmt->bindParam(':location', $data->location);
    $stmt->bindParam(':distance', $distance);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':blood_group', $data->blood_group);
    $stmt->bindParam(':units_needed', $units_needed);
    $stmt->bindParam(':image', $image_path);
    $stmt->bindParam(':mobile', $mobile);
    $stmt->bindParam(':category', $category);
    $stmt->bindParam(':latitude', $latitude);
    $stmt->bindParam(':longitude', $longitude);
    
    try {
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Post added successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to add post"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "DB Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
}

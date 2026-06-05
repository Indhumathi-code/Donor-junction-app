<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid request body"]);
    exit();
}

$id = isset($data['id']) ? $data['id'] : '';
$name = isset($data['name']) ? $data['name'] : '';
$category = isset($data['category']) ? $data['category'] : '';
$license = isset($data['license']) ? $data['license'] : '';
$mobile = isset($data['mobile']) ? $data['mobile'] : '';
$city = isset($data['city']) ? $data['city'] : '';
$address = isset($data['address']) ? $data['address'] : '';
$pincode = isset($data['pincode']) ? $data['pincode'] : '';
$doc_uri = isset($data['doc_uri']) ? $data['doc_uri'] : null;
$doc_type = isset($data['doc_type']) ? $data['doc_type'] : 'image';
$doc_name = isset($data['doc_name']) ? $data['doc_name'] : null;
$latitude = isset($data['latitude']) ? $data['latitude'] : null;
$longitude = isset($data['longitude']) ? $data['longitude'] : null;

if (empty($id) || empty($name) || empty($category) || empty($license) || empty($mobile) || empty($city) || empty($address) || empty($pincode)) {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    exit();
}

if (empty($latitude) || empty($longitude)) {
    // Try to geocode address + city + pincode using Nominatim OpenStreetMap API
    $addressQuery = urlencode($address . ", " . $city . ", " . $pincode);
    $url = "https://nominatim.openstreetmap.org/search?format=json&q=" . $addressQuery;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'DonorJunctionHub/1.0');
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    $response = curl_exec($ch);
    curl_close($ch);
    
    if ($response) {
        $json = json_decode($response, true);
        if (!empty($json) && isset($json[0]['lat']) && isset($json[0]['lon'])) {
            $latitude = (float)$json[0]['lat'];
            $longitude = (float)$json[0]['lon'];
        }
    }
    
    // If geocoding failed, fall back to city coordinates with a small random offset
    if (empty($latitude) || empty($longitude)) {
        $lowerCity = strtolower($city);
        if (strpos($lowerCity, 'madurai') !== false) {
            $latitude = 9.9252 + (mt_rand(-50, 50) / 1000.0);
            $longitude = 78.1198 + (mt_rand(-50, 50) / 1000.0);
        } else if (strpos($lowerCity, 'chennai') !== false) {
            $latitude = 13.0827 + (mt_rand(-50, 50) / 1000.0);
            $longitude = 80.2707 + (mt_rand(-50, 50) / 1000.0);
        } else if (strpos($lowerCity, 'coimbatore') !== false) {
            $latitude = 11.0168 + (mt_rand(-50, 50) / 1000.0);
            $longitude = 76.9558 + (mt_rand(-50, 50) / 1000.0);
        } else if (strpos($lowerCity, 'trichy') !== false || strpos($lowerCity, 'tiruchirappalli') !== false) {
            $latitude = 10.7905 + (mt_rand(-50, 50) / 1000.0);
            $longitude = 78.7047 + (mt_rand(-50, 50) / 1000.0);
        } else if (strpos($lowerCity, 'salem') !== false) {
            $latitude = 11.6643 + (mt_rand(-50, 50) / 1000.0);
            $longitude = 78.1460 + (mt_rand(-50, 50) / 1000.0);
        } else {
            // General Tamil Nadu fallback center
            $latitude = 11.0 + (mt_rand(-300, 300) / 1000.0);
            $longitude = 78.0 + (mt_rand(-300, 300) / 1000.0);
        }
    }
}

try {
    // Check if mobile or license already exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM organizations WHERE mobile = :mobile OR license = :license");
    $stmt->execute(['mobile' => $mobile, 'license' => $license]);
    if ($stmt->fetchColumn() > 0) {
        echo json_encode(["status" => "error", "message" => "Mobile number or License number already registered"]);
        exit();
    }

    $stmt = $pdo->prepare("INSERT INTO organizations (id, name, category, license, mobile, city, address, pincode, status, doc_uri, doc_type, doc_name, latitude, longitude) 
        VALUES (:id, :name, :category, :license, :mobile, :city, :address, :pincode, 'pending', :doc_uri, :doc_type, :doc_name, :latitude, :longitude)");
    
    $stmt->execute([
        'id' => $id,
        'name' => $name,
        'category' => $category,
        'license' => $license,
        'mobile' => $mobile,
        'city' => $city,
        'address' => $address,
        'pincode' => $pincode,
        'doc_uri' => $doc_uri,
        'doc_type' => $doc_type,
        'doc_name' => $doc_name,
        'latitude' => $latitude,
        'longitude' => $longitude
    ]);

    echo json_encode(["status" => "success", "message" => "Organization registered successfully, pending approval."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

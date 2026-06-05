<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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

$mobile = isset($data['mobile']) ? $data['mobile'] : '';
$name = isset($data['name']) ? $data['name'] : '';
$city = isset($data['city']) ? $data['city'] : '';

if (empty($mobile) || empty($name) || empty($city)) {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    exit();
}

$cleaned_mobile = preg_replace('/[\s\-_]/', '', $mobile);

// Geocode the new city coordinates using Nominatim API
$latitude = null;
$longitude = null;

$addressQuery = urlencode($city . ", Tamil Nadu, India");
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

// Fallback to city coordinates with a small random offset if Nominatim failed
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

try {
    $stmt = $pdo->prepare("UPDATE organizations SET name = :name, city = :city, latitude = :latitude, longitude = :longitude WHERE mobile = :mobile");
    $stmt->execute([
        'name' => $name,
        'city' => $city,
        'latitude' => $latitude,
        'longitude' => $longitude,
        'mobile' => $cleaned_mobile
    ]);

    echo json_encode([
        "status" => "success", 
        "message" => "Profile updated successfully.",
        "latitude" => $latitude,
        "longitude" => $longitude
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

<?php
require_once 'db_config.php';

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

// Auto-create users table if not exists
$tableQuery = "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    mobile VARCHAR(50) UNIQUE,
    blood_group VARCHAR(10),
    dob VARCHAR(50),
    gender VARCHAR(50),
    last_donation_date VARCHAR(50),
    city VARCHAR(255),
    address TEXT NULL,
    pincode VARCHAR(20) NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";
$conn->exec($tableQuery);

function addColumnIfMissing($conn, $table, $column, $definition) {
    $check = $conn->prepare(
        "SELECT COUNT(*) AS count FROM information_schema.columns " .
        "WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column"
    );
    $check->execute([':table' => $table, ':column' => $column]);
    $row = $check->fetch(PDO::FETCH_ASSOC);
    if ($row && $row['count'] == 0) {
        $conn->exec("ALTER TABLE `$table` ADD COLUMN `$column` $definition");
    }
}

addColumnIfMissing($conn, 'users', 'city', 'VARCHAR(255) NULL');
addColumnIfMissing($conn, 'users', 'address', 'TEXT NULL');
addColumnIfMissing($conn, 'users', 'pincode', 'VARCHAR(20) NULL');
addColumnIfMissing($conn, 'users', 'latitude', 'DECIMAL(10, 8) NULL');
addColumnIfMissing($conn, 'users', 'longitude', 'DECIMAL(11, 8) NULL');

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name) && !empty($data->mobile)) {
    $cleaned_mobile = cleanMobile($data->mobile);
    $query = "INSERT INTO users (name, mobile, blood_group, dob, gender, last_donation_date, address, city, pincode, latitude, longitude) 
              VALUES (:name, :mobile, :blood_group, :dob, :gender, :last_donation_date, :address, :city, :pincode, :latitude, :longitude)";
    
    $stmt = $conn->prepare($query);
    
    $stmt->bindParam(':name', $data->name);
    $stmt->bindParam(':mobile', $cleaned_mobile);
    $stmt->bindParam(':blood_group', $data->blood_group);
    $stmt->bindParam(':dob', $data->dob);
    $stmt->bindParam(':gender', $data->gender);
    $stmt->bindParam(':last_donation_date', $data->last_donation_date);
    $stmt->bindParam(':address', $data->address);
    $stmt->bindParam(':city', $data->city);
    $stmt->bindParam(':pincode', $data->pincode);
    $stmt->bindParam(':latitude', $data->latitude);
    $stmt->bindParam(':longitude', $data->longitude);

    try {
        $stmt->execute();
        $user_id = $conn->lastInsertId();
        $userQuery = "SELECT * FROM users WHERE id = :id";
        $userStmt = $conn->prepare($userQuery);
        $userStmt->bindParam(':id', $user_id);
        $userStmt->execute();
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "message" => "Registration successful",
            "user" => $user
        ]);
    } catch (PDOException $e) {
        $message = $e->getCode() === '23000' ? 'This mobile number is already registered.' : 'Registration failed: ' . $e->getMessage();
        echo json_encode(["status" => "error", "message" => $message]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
}
?>

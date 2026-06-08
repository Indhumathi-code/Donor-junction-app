<?php
$conn = new PDO("mysql:host=127.0.0.1;port=3306", "root", "");
$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$conn->exec("USE `donor-junction`");

$conn->exec("CREATE TABLE IF NOT EXISTS users (
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
    profile_image LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$conn->exec("INSERT IGNORE INTO users (id, name, mobile, blood_group, dob, gender, last_donation_date, address, city, pincode, latitude, longitude) VALUES 
    (1, 'Ravi Prasad', '9876543210', 'A+', '1995-05-12', 'Male', '2026-03-10', '11, T Nagar, Chennai', 'Chennai', '600017', 13.0401, 80.2405),
    (2, 'Siva Priya', '9876543211', 'B+', '1998-08-22', 'Female', '2026-04-15', '46, RS Puram, Coimbatore', 'Coimbatore', '641002', 11.0191, 76.9622),
    (3, 'Mohammed Rafiq', '9876543212', 'O+', '1992-11-05', 'Male', '2026-02-28', '79, Srirangam Road, Trichy', 'Trichy', '620006', 10.7937, 78.7016),
    (4, 'Anitha Balan', '9876543213', 'AB+', '2000-01-30', 'Female', '2026-05-01', '24, NGO Colony, Tirunelveli', 'Tirunelveli', '627007', 8.7214, 77.7516),
    (5, 'Antigravity', '7083696321', 'A+', '2008-06-16', 'Male', '0000-00-00', 'Goriapalyam, Madurai', 'Madurai', '625002', 9.9264, 78.1249),
    (6, 'aruna', '9876543222', 'A+', '2000-01-01', 'Female', '0000-00-00', 'madurai', 'madurai', '625001', 9.92, 78.12)
");
echo "Table created successfully!";
?>

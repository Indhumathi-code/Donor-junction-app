<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

$host = "127.0.0.1";
$port = "3303";
$username = "root";
$password = "";

try {
    // Connect to MySQL server without selecting db first
    $conn = new PDO("mysql:host=" . $host . ";port=" . $port, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create database
    $conn->exec("CREATE DATABASE IF NOT EXISTS `donor_junction`");
    $conn->exec("USE `donor_junction`");
    
    // Create otps table
    $conn->exec("CREATE TABLE IF NOT EXISTS otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mobile VARCHAR(20) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Disable foreign key checks to allow dropping tables with dependencies
    $conn->exec("SET FOREIGN_KEY_CHECKS = 0");

    // Drop organizations table first if exists to ensure schema updates
    $conn->exec("DROP TABLE IF EXISTS organizations");
    $conn->exec("DROP TABLE IF EXISTS messages");
    $conn->exec("DROP TABLE IF EXISTS active_admins");
    $conn->exec("DROP TABLE IF EXISTS users");


    // Create users table
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Seed default users
    $conn->exec("INSERT INTO users (id, name, mobile, blood_group, dob, gender, last_donation_date, address, city, pincode, latitude, longitude) VALUES 
        (1, 'Ravi Prasad', '9876543210', 'A+', '1995-05-12', 'Male', '2026-03-10', '11, T Nagar, Chennai', 'Chennai', '600017', 13.0401, 80.2405),
        (2, 'Siva Priya', '9876543211', 'B+', '1998-08-22', 'Female', '2026-04-15', '46, RS Puram, Coimbatore', 'Coimbatore', '641002', 11.0191, 76.9622),
        (3, 'Mohammed Rafiq', '9876543212', 'O+', '1992-11-05', 'Male', '2026-02-28', '79, Srirangam Road, Trichy', 'Trichy', '620006', 10.7937, 78.7016),
        (4, 'Anitha Balan', '9876543213', 'AB+', '2000-01-30', 'Female', '2026-05-01', '24, NGO Colony, Tirunelveli', 'Tirunelveli', '627007', 8.7214, 77.7516),
        (5, 'Antigravity', '7083696321', 'A+', '2008-06-16', 'Male', '0000-00-00', 'Goriapalyam, Madurai', 'Madurai', '625002', 9.9264, 78.1249)
    ");

    // Create organizations table
    $conn->exec("CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        license VARCHAR(100) NOT NULL UNIQUE,
        mobile VARCHAR(20) NOT NULL UNIQUE,
        city VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        doc_uri TEXT,
        doc_type VARCHAR(10) DEFAULT 'image',
        doc_name VARCHAR(100),
        latitude DECIMAL(10, 8) NULL,
        longitude DECIMAL(11, 8) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Seed default organizations if table is empty
    $stmt = $conn->query("SELECT COUNT(*) FROM organizations");
    if ($stmt->fetchColumn() == 0) {
        $conn->exec("INSERT INTO organizations (id, name, category, license, mobile, city, address, pincode, status, latitude, longitude) VALUES 
            ('9840012345', 'Apollo Hospital (Chennai)', 'Hospital', 'TN-MED-2024-00872', '9840012345', 'Chennai', 'Apollo Hospital Main Auditorium', '600006', 'approved', 13.0601, 80.2506),
            ('9988776655', 'City Care Blood Bank', 'Blood Bank', 'CC-BB-2026-9921', '9988776655', 'Chennai', '56, Poonamallee High Road, Kilpauk', '600010', 'approved', 13.0792, 80.2401),
            ('9444155662', 'Red Cross NGO (Madurai)', 'NGO', 'RC-NGO-2025-0012', '9444155662', 'Madurai', '12, Gandhi Road, Madurai', '625020', 'approved', 9.9252, 78.1198),
            ('8870199882', 'MGM Healthcare NGO', 'NGO', 'MGM-NGO-2026-881', '8870199882', 'Chennai', '10, OMR Road, Kandanchavadi', '600096', 'approved', 13.0650, 80.2550)
        ");
    }

    // Create active_admins table
    $conn->exec("CREATE TABLE IF NOT EXISTS active_admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        org_name VARCHAR(100) NOT NULL,
        admin_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL UNIQUE,
        status VARCHAR(20) DEFAULT 'Active',
        joined_date VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Seed default active admins if table is empty
    $stmt = $conn->query("SELECT COUNT(*) FROM active_admins");
    if ($stmt->fetchColumn() == 0) {
        $conn->exec("INSERT INTO active_admins (org_name, admin_name, email, phone, status, joined_date) VALUES 
            ('Apollo Hospital (Chennai)', 'Dr. Ramesh Prasad', 'ramesh.apollochennai@hospital.in', '+91 98400 12345', 'Active', 'Mar 15, 2026'),
            ('Red Cross NGO (Madurai)', 'Sister Teresa Mary', 'teresa.redcrossmadurai@ngo.org', '+91 94441 55662', 'Active', 'Apr 02, 2026'),
            ('MGM Healthcare NGO', 'Sanjay Dutt', 'sanjay.dutt@mgmhealth.org', '+91 88701 99882', 'Suspended', 'May 01, 2026')
        ");
    }

    // Create campaigns table
    $conn->exec("CREATE TABLE IF NOT EXISTS campaigns (
        id VARCHAR(50) PRIMARY KEY,
        org_mobile VARCHAR(20) NOT NULL,
        title VARCHAR(150) NOT NULL,
        date_time VARCHAR(150) NOT NULL,
        place VARCHAR(150) NOT NULL,
        status VARCHAR(20) NOT NULL,
        status_color VARCHAR(10) NOT NULL,
        status_bg VARCHAR(10) NOT NULL,
        description TEXT NOT NULL,
        collected INT DEFAULT 0,
        target INT NOT NULL,
        image_uri TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Seed default campaigns if table is empty
    $stmt = $conn->query("SELECT COUNT(*) FROM campaigns");
    if ($stmt->fetchColumn() == 0) {
        $conn->exec("INSERT INTO campaigns (id, org_mobile, title, date_time, place, status, status_color, status_bg, description, collected, target) VALUES 
            ('1', '9840012345', 'World Blood Day 2025', 'June 14 • 09:00 AM - 05:00 PM', 'Apollo Hospital Main Auditorium', 'Active', '#27500A', '#E8F5E9', 'All blood groups • 50 donors registered', 32, 50),
            ('2', '9840012345', 'A+ emergency drive', 'June 10–16 • 24 Hours Open', 'Chennai Central Blood Bank', 'Urgent', '#C82333', '#FFEBEE', 'A+ only • 2 donors confirmed', 3, 10),
            ('3', '9840012345', 'Monthly thalassemia donors', 'Recurring • 10:00 AM - 02:00 PM', 'Red Cross Society Clinic', 'Open', '#0C447C', '#E3F2FD', 'O- only • 5 regular donors', 0, 5)
        ");
    }

    // Create messages table
    $conn->exec("CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        donor_id VARCHAR(50) NOT NULL,
        org_mobile VARCHAR(20) NOT NULL,
        message_text TEXT NOT NULL,
        is_me TINYINT(1) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Seed default messages if table is empty
    $stmt = $conn->query("SELECT COUNT(*) FROM messages");
    if ($stmt->fetchColumn() == 0) {
        $conn->exec("INSERT INTO messages (donor_id, org_mobile, message_text, is_me) VALUES 
            ('1', '9840012345', 'Hello Ravi! We urgently need A+ blood. Can you donate on June 15?', 1),
            ('1', '9840012345', 'Yes, I am available. What time should I come?', 0),
            ('1', '9840012345', 'Please come by 9 AM. Bring your Aadhaar card.', 1),
            ('1', '9840012345', 'Sure, I will be there by 9 AM!', 0),
            ('1', '9840012345', 'Thank you Ravi. You are saving a life today!', 1),
            ('2', '9840012345', 'Hello Siva Priya! We need A+ blood for an emergency donation. Are you available?', 1),
            ('2', '9840012345', 'Yes, I can donate. Can I come on June 16 instead?', 0),
            ('2', '9840012345', 'June 16 works perfectly! The donation camp is open from 8 AM to 4 PM.', 1),
            ('2', '9840012345', 'Perfect, I will schedule my time for June 16 morning!', 0),
            ('3', '9840012345', 'Hello Mohammed Rafiq! We noticed you recently donated. How are you feeling?', 1),
            ('3', '9840012345', 'I am doing great! Ready to help again once my waiting period is over.', 0),
            ('3', '9840012345', 'Awesome! Your waiting period ends in 56 days. We will reach out to you then!', 1),
            ('4', '9840012345', 'Hello Anitha! We are organizing a blood donation drive. Can you support us?', 1),
            ('4', '9840012345', 'I would love to help! What documents should I bring?', 0),
            ('4', '9840012345', 'Please bring any government ID card like Aadhaar or driving license.', 1),
            ('4', '9840012345', 'Sure, I will make sure to bring my Aadhaar card. See you there!', 0)
        ");
    }

    // Re-enable foreign key checks
    $conn->exec("SET FOREIGN_KEY_CHECKS = 1");

    echo json_encode(["status" => "success", "message" => "Database and tables initialized successfully."]);
} catch(PDOException $e) {
    // Attempt to re-enable foreign key checks even on failure
    try {
        $conn->exec("SET FOREIGN_KEY_CHECKS = 1");
    } catch(Exception $ex) {}
    echo json_encode(["status" => "error", "message" => "Setup failed: " . $e->getMessage()]);
}
?>


-- Database creation
CREATE DATABASE IF NOT EXISTS `donor-junction`;
USE `donor-junction`;

-- Table for tracking OTP verifications
CREATE TABLE IF NOT EXISTS otps (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    mobile VARCHAR(20) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for organization registration details
CREATE TABLE IF NOT EXISTS organizations (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default organizations
INSERT INTO organizations (id, name, category, license, mobile, city, address, pincode, status) VALUES 
('9840012345', 'Apollo Hospital (Chennai)', 'Hospital', 'TN-MED-2024-00872', '9840012345', 'Chennai', 'Apollo Hospital Main Auditorium', '600006', 'approved'),
('9988776655', 'City Care Blood Bank', 'Blood Bank', 'CC-BB-2026-9921', '9988776655', 'Chennai', '56, Poonamallee High Road, Kilpauk', '600010', 'pending')
ON DUPLICATE KEY UPDATE name=name;

-- Table for active admins
CREATE TABLE IF NOT EXISTS active_admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_name VARCHAR(100) NOT NULL,
    admin_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'Active',
    joined_date VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default active admins if they don't exist
INSERT INTO active_admins (org_name, admin_name, email, phone, status, joined_date) VALUES 
('Apollo Hospital (Chennai)', 'Dr. Ramesh Prasad', 'ramesh.apollochennai@hospital.in', '+91 98400 12345', 'Active', 'Mar 15, 2026'),
('Red Cross NGO (Madurai)', 'Sister Teresa Mary', 'teresa.redcrossmadurai@ngo.org', '+91 94441 55662', 'Active', 'Apr 02, 2026'),
('MGM Healthcare NGO', 'Sanjay Dutt', 'sanjay.dutt@mgmhealth.org', '+91 88701 99882', 'Suspended', 'May 01, 2026')
ON DUPLICATE KEY UPDATE org_name=org_name;

-- Table for donation campaigns
CREATE TABLE IF NOT EXISTS campaigns (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default campaigns if they don't exist
INSERT INTO campaigns (id, org_mobile, title, date_time, place, status, status_color, status_bg, description, collected, target) VALUES 
('1', '9840012345', 'World Blood Day 2025', 'June 14 • 09:00 AM - 05:00 PM', 'Apollo Hospital Main Auditorium', 'Active', '#27500A', '#E8F5E9', 'All blood groups • 50 donors registered', 32, 50),
('2', '9840012345', 'A+ emergency drive', 'June 10–16 • 24 Hours Open', 'Chennai Central Blood Bank', 'Urgent', '#C82333', '#FFEBEE', 'A+ only • 2 donors confirmed', 3, 10),
('3', '9840012345', 'Monthly thalassemia donors', 'Recurring • 10:00 AM - 02:00 PM', 'Red Cross Society Clinic', 'Open', '#0C447C', '#E3F2FD', 'O- only • 5 regular donors', 0, 5)
ON DUPLICATE KEY UPDATE title=title;

-- Table for tracking messages/chats
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id VARCHAR(50) NOT NULL,
    org_mobile VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    is_me TINYINT(1) NOT NULL, -- 1 = sent by organization, 0 = sent by donor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default messages matching the React Native mockup
INSERT INTO messages (donor_id, org_mobile, message_text, is_me) VALUES 
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
('4', '9840012345', 'Sure, I will make sure to bring my Aadhaar card. See you there!', 0);

-- Table for user certificates
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mobile VARCHAR(20) NOT NULL,
    title VARCHAR(150) NOT NULL,
    issued_by VARCHAR(150) NOT NULL,
    date VARCHAR(50) NOT NULL,
    image_uri TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


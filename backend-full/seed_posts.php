<?php
require_once 'db_config.php';

$conn->exec("INSERT IGNORE INTO blood_posts (id, title, type, location, distance, description, blood_group, units_needed, mobile, category, created_at) VALUES 
(1, 'B+ blood needed', 'urgent', 'anna nagar, madurai', '2.1 km', 'post test', 'B+', '1', '6382073039', 'seeker', '2026-05-15 11:00:00'),
(2, 'A+ blood needed', 'urgent', 'Apollo Hospital, Chennai', '4.8 km', 'Urgent requirement for surgery patient.', 'A+', '2', '9876543210', 'seeker', '2026-06-02 09:30:00'),
(3, 'O+ platelets required', 'normal', 'Fortis Healthcare, Chennai', '6.5 km', 'Dengue fever patient requiring platelets.', 'O+', '4', '6382073039', 'seeker', '2026-06-03 15:45:00')
");
echo "Seeded blood_posts";
?>

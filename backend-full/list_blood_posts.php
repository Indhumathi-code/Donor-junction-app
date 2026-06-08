<?php
$conn = new PDO("mysql:host=127.0.0.1;port=3306;dbname=donor-junction", "root", "");
foreach($conn->query("SELECT id, title FROM blood_posts") as $row) {
    echo $row['id'] . " - " . $row['title'] . PHP_EOL;
}
?>

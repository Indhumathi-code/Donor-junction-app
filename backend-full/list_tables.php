<?php
$conn = new PDO("mysql:host=127.0.0.1;port=3306", "root", "");
foreach($conn->query("SHOW DATABASES") as $row) {
    echo "DB: " . $row[0] . PHP_EOL;
    try {
        foreach($conn->query("SHOW TABLES FROM `" . $row[0] . "`") as $trow) {
            echo "  - " . $trow[0] . PHP_EOL;
        }
    } catch (Exception $e) {}
}
?>

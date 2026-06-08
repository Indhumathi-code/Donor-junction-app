<?php
$conn = new PDO("mysql:host=127.0.0.1;port=3306", "root", "");
foreach($conn->query("SHOW DATABASES") as $row) {
    echo $row[0] . PHP_EOL;
}
?>

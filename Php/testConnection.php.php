<?php
include("config.php");

// Attempt to connect to MySQL
$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port, $cd_socket);

// Check connection
if ($conn->connect_error) {
    die("❌ Database connection failed: " . $conn->connect_error);
} else {
    echo "✅ Connected successfully to MySQL!";
}

$conn->close();
?>

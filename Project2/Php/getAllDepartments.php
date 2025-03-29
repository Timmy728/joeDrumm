<?php
include 'config.php';

header("Content-Type: application/json");

$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port);

if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

// Fetch departments with location names
$sql = "SELECT 
            department.id, 
            department.name, 
            location.name AS location 
        FROM department 
        LEFT JOIN location ON department.locationID = location.id
        ORDER BY department.name";

$result = $conn->query($sql);
$departments = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $departments[] = $row;
    }
    echo json_encode(["status" => "success", "data" => $departments]);
} else {
    echo json_encode(["status" => "error", "message" => "Query failed"]);
}

$conn->close();
?>
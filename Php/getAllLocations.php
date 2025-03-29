<?php
include 'config.php';

header("Content-Type: application/json");

$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port);

if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

$sql = "SELECT id, name FROM location ORDER BY name";

$result = $conn->query($sql);
$locations = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $locations[] = $row;
    }
    echo json_encode(["status" => "success", "data" => $locations]);
} else {
    echo json_encode(["status" => "error", "message" => "Query failed"]);
}

$conn->close();
?>
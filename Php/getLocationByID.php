<?php
// getLocationByID.php

ini_set('display_errors', 'On');
error_reporting(E_ALL);

include("config.php");

header('Content-Type: application/json; charset=UTF-8');

$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port, $cd_socket);

if ($conn->connect_error) {
    echo json_encode(["status" => ["code" => 300, "description" => "Database connection failed"]]);
    exit;
}

$id = $_POST['id'] ?? null;

if (!$id) {
    echo json_encode(["status" => ["code" => 400, "description" => "No ID provided"]]);
    exit;
}

$query = $conn->prepare("SELECT id, name FROM location WHERE id = ?");
$query->bind_param("i", $id);
$query->execute();
$result = $query->get_result();
$data = $result->fetch_assoc();

if ($data) {
    echo json_encode([
        "status" => ["code" => 200, "description" => "Success"],
        "data" => $data
    ]);
} else {
    echo json_encode(["status" => ["code" => 404, "description" => "Location not found"]]);
}

$conn->close();
?>
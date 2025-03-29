<?php
// updateLocation.php

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
$name = $_POST['name'] ?? '';

if (!$id || $name === '') {
    echo json_encode(["status" => ["code" => 400, "description" => "ID and name required"]]);
    exit;
}

$query = $conn->prepare("UPDATE location SET name = ? WHERE id = ?");
$query->bind_param("si", $name, $id);
$query->execute();

if ($query->affected_rows > 0) {
    echo json_encode(["status" => ["code" => 200, "description" => "Location updated"]]);
} else {
    echo json_encode(["status" => ["code" => 204, "description" => "No changes made"]]);
}

$conn->close();
?>
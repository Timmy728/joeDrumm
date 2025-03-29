<?php
// insertLocation.php

ini_set('display_errors', 'On');
error_reporting(E_ALL);

include("config.php");

header('Content-Type: application/json; charset=UTF-8');

$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port, $cd_socket);

if ($conn->connect_error) {
    echo json_encode(["status" => ["code" => 300, "description" => "Database connection failed"]]);
    exit;
}

$name = $_POST['name'] ?? '';

if ($name === '') {
    echo json_encode(["status" => ["code" => 400, "description" => "Location name required"]]);
    exit;
}

$query = $conn->prepare("INSERT INTO location (name) VALUES (?)");
$query->bind_param("s", $name);
$query->execute();

if ($query->affected_rows > 0) {
    echo json_encode(["status" => ["code" => 200, "description" => "Location added"]]);
} else {
    echo json_encode(["status" => ["code" => 500, "description" => "Insert failed"]]);
}

$conn->close();

?>
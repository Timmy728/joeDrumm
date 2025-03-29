<?php
// deleteLocationByID.php

ini_set('display_errors', 'On');
error_reporting(E_ALL);

include("config.php");

header('Content-Type: application/json; charset=UTF-8');

$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port, $cd_socket);

if ($conn->connect_error) {
    echo json_encode([
        "status" => [
            "code" => 300,
            "description" => "Database connection failed"
        ]
    ]);
    exit;
}

$id = $_POST['id'] ?? null;

if (!$id) {
    echo json_encode([
        "status" => [
            "code" => 400,
            "description" => "Missing location ID"
        ]
    ]);
    exit;
}

// Check for dependencies (departments linked to this location)
$check = $conn->prepare("SELECT id FROM department WHERE locationID = ?");
$check->bind_param("i", $id);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode([
        "status" => [
            "code" => 403,
            "description" => "❌ Cannot delete. Location has departments assigned."
        ]
    ]);
    $check->close();
    $conn->close();
    exit;
}

$check->close();

// Safe to delete
$delete = $conn->prepare("DELETE FROM location WHERE id = ?");
$delete->bind_param("i", $id);
$delete->execute();

if ($delete->affected_rows > 0) {
    echo json_encode([
        "status" => [
            "code" => 200,
            "description" => "✅ Location deleted."
        ]
    ]);
} else {
    echo json_encode([
        "status" => [
            "code" => 500,
            "description" => "❌ Failed to delete location."
        ]
    ]);
}

$delete->close();
$conn->close();

?>
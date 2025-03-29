<?php
include 'config.php';

header("Content-Type: application/json");

$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port);

if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

if (!isset($_POST['id'])) {
    echo json_encode(["status" => "error", "message" => "Missing ID"]);
    exit();
}

$id = $_POST['id'];

// Delete personnel by ID
$sql = "DELETE FROM personnel WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to delete personnel"]);
}

$conn->close();
?>
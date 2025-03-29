<?php
include 'config.php';

header('Content-Type: application/json');

$response = ['status' => ['code' => 400, 'description' => 'Invalid request']];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'], $_POST['name'], $_POST['locationID'])) {
    $departmentID = $_POST['id'];
    $departmentName = $_POST['name'];
    $locationID = $_POST['locationID'];

    $conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port, $cd_socket);

    if ($conn->connect_error) {
        $response['status'] = ['code' => 500, 'description' => 'Database connection failed'];
        echo json_encode($response);
        exit();
    }

    $stmt = $conn->prepare("UPDATE department SET name = ?, locationID = ? WHERE id = ?");
    $stmt->bind_param("sii", $departmentName, $locationID, $departmentID);

    if ($stmt->execute()) {
        $response['status'] = ['code' => 200, 'description' => 'Department updated successfully'];
    } else {
        $response['status'] = ['code' => 500, 'description' => 'Failed to update department'];
    }

    $stmt->close();
    $conn->close();
}

echo json_encode($response);
?>
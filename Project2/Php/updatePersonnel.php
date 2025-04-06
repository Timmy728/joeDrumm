<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

include("db.php");

$response = [
    "status" => ["code" => 500, "description" => "error"],
    "message" => "❌ Something went wrong"
];

$id = $_POST['id'] ?? null;
$firstName = $_POST['firstName'] ?? null;
$lastName = $_POST['lastName'] ?? null;
$jobTitle = $_POST['jobTitle'] ?? null;
$email = $_POST['email'] ?? null;
$departmentID = $_POST['departmentID'] ?? null;

// Validate required fields
if (!$id || !$firstName || !$lastName || !$email) {
    $response['message'] = "❌ Missing required fields.";
    echo json_encode($response);
    exit;
}

// Allow null for department
if ($departmentID === "") {
    $departmentID = null;
}

try {
    $query = $conn->prepare(
        "UPDATE personnel 
         SET firstName = :firstName,
             lastName = :lastName,
             jobTitle = :jobTitle,
             email = :email,
             departmentID = :departmentID
         WHERE id = :id"
    );

    $query->bindParam(':firstName', $firstName);
    $query->bindParam(':lastName', $lastName);
    $query->bindParam(':jobTitle', $jobTitle);
    $query->bindParam(':email', $email);
    $query->bindParam(':departmentID', $departmentID);
    $query->bindParam(':id', $id);

    $query->execute();

    $response["status"]["code"] = 200;
    $response["status"]["description"] = "success";
    $response["message"] = "✅ Personnel updated successfully!";
} catch (PDOException $e) {
    $response["message"] = "❌ " . $e->getMessage();
}

echo json_encode($response);
?>

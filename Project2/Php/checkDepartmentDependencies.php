<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
include(__DIR__ . "/db.php");

$id = $_POST['departmentID'] ?? null;

if (!$id) {
    echo json_encode(["status" => ["code" => 400, "description" => "Missing department ID"]]);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM personnel WHERE departmentID = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $hasPersonnel = $row['total'] > 0;

    echo json_encode([
        "status" => [
            "code" => 200,
            "hasPersonnel" => $hasPersonnel
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => ["code" => 500, "description" => $e->getMessage()]]);
}
?>

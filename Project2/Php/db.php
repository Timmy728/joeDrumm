<?php
$cd_host = "localhost";
$cd_port = 3306;
$cd_socket = "";
$cd_dbname = "joedybtq_companydirectory";
$cd_user = "joedybtq_user1";
$cd_password = "Timmy@12345678910";

try {
    $conn = new PDO("mysql:host=$cd_host;dbname=$cd_dbname;charset=utf8", $cd_user, $cd_password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["status" => ["code" => 500, "description" => "Database connection failed"]]);
    exit;
}
?>

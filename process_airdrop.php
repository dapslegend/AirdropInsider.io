<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $uploadDir = 'images/airdrops/';
    $uploadFile = $uploadDir . basename($_FILES['airdropImage']['name']);
    $imageFileType = strtolower(pathinfo($uploadFile,PATHINFO_EXTENSION));

    // Check if image file is a actual image or fake image
    $check = getimagesize($_FILES["airdropImage"]["tmp_name"]);
    if($check !== false) {
        // Allow certain file formats
        if($imageFileType != "jpg" && $imageFileType != "png" && $imageFileType != "jpeg"
        && $imageFileType != "gif" ) {
            echo "Sorry, only JPG, JPEG, PNG & GIF files are allowed.";
            exit;
        }

        if (move_uploaded_file($_FILES["airdropImage"]["tmp_name"], $uploadFile)) {
            $newAirdrop = [
                'cardTitle' => $_POST['cardTitle'],
                'cardText' => $_POST['cardText'],
                'farmingLink' => $_POST['farmingLink'],
                'modalTitle' => $_POST['modalTitle'],
                'modalText' => $_POST['modalText'],
                'imagePath' => $uploadFile
            ];

            $airdropsFile = 'airdrops.json';
            $currentAirdrops = file_exists($airdropsFile) ? json_decode(file_get_contents($airdropsFile), true) : [];
            $currentAirdrops[] = $newAirdrop;

            file_put_contents($airdropsFile, json_encode($currentAirdrops, JSON_PRETTY_PRINT));

            header('Location: index.php?success=1');
            exit;
        } else {
            echo "Sorry, there was an error uploading your file.";
        }
    } else {
        echo "File is not an image.";
    }
}
?>

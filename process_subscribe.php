<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo "Please enter a valid email address.";
        exit;
    }

    $recipient = "support@airdropinsider.io";
    $subject = "New Newsletter Subscription";
    $email_content = "New subscriber: $email";
    $email_headers = "From: $email";

    if (mail($recipient, $subject, $email_content, $email_headers)) {
        http_response_code(200);
        echo "Thank you for subscribing to our newsletter!";
    } else {
        http_response_code(500);
        echo "Oops! Something went wrong and we couldn't process your subscription.";
    }
} else {
    http_response_code(403);
    echo "There was a problem with your submission, please try again.";
}

?>
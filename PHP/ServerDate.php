<?php
$now = round(1000 * microtime(true));

if (filter_input(INPUT_GET, 'time')) {
    header('Content-type: application/json');
    echo $now;
}
else {
    header('Content-type: text/javascript');
    include('../lib/ServerDate.js');
    echo "($now);";
}

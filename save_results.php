<?php
$filename = $_POST['filename'];
$fh = fopen($filename, 'w') or die ("cannot open file " . $filename);
if (flock($fh, LOCK_EX)) {
    fwrite($fh, $_POST['json']); // or whatever key/keys you posted to the php script
    flock($fh, LOCK_UN);
}
fclose($fh);
?>
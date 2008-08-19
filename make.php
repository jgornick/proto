<?php
  // Requires:
  // packer.php - JavaScript packer
  // PHP Zip extension to be enabled

  /***************************************************************************/

  // Prevent from being run from the web.
  if ($_SERVER['argc'] == 0) return;

  /***************************************************************************/

  define('PROTO_VERSION', '1.0.0');

  define('PROTO_SOURCE_DIR', dirname(__FILE__) . '/src');
  define('PROTO_DIST_DIR', dirname(__FILE__) . '/dist');
  define('PROTO_LIB_DIR', dirname(__FILE__) . '/lib');
  define('PROTO_DOCS_DIR', dirname(__FILE__) . '/docs');

  /***************************************************************************/

  $PROTO_SOURCE_FILES = array(
    'HEADER',
    'methods.js',
    'observable.js',    
    'accordion.js',
    'areaselector.js',
    'imagesobserver.js',
    'maskedinput.js',
    'progressbar.js',
    'splitter.js',
    'tabcontrol.js',
    'textresizedetection.js',
    'toolbar.js',
    'tree.js'
  );

  $DIST_PROTO = constant('PROTO_DIST_DIR') . '/proto.js';
  $DIST_PROTO_PACK = constant('PROTO_DIST_DIR') . '/proto-pack.js';

  $DIST_PROTO_ZIP = constant('PROTO_DIST_DIR') . '/proto.zip';
  $DIST_PROTO_PACK_ZIP = constant('PROTO_DIST_DIR') . '/proto-pack.zip';

  $LIB_PROTOTYPE = constant('PROTO_LIB_DIR') . '/prototype.js';
  $LIB_PROTOTYPE_PACK = constant('PROTO_LIB_DIR') . '/prototype-pack.js';
  $LIB_EFFECTS = constant('PROTO_LIB_DIR') . '/effects.js';

  /***************************************************************************/

  // Create the new proto.js
  echo 'Building proto.js...' . chr(13) . chr(10);
  
  unlink($DIST_PROTO);
  unlink($DIST_PROTO_PACK);

  foreach($PROTO_SOURCE_FILES as $source)
  {
    $source_filename = constant('PROTO_SOURCE_DIR') . '/' . $source;

    $contents  = str_replace('%PROTO_VERSION%', constant('PROTO_VERSION'), file_get_contents($source_filename));
    $contents .= chr(13) . chr(10) . chr(13) . chr(10);

    file_put_contents($DIST_PROTO, $contents, FILE_APPEND);
  }

  /***************************************************************************/

  // Generate our documentation
  echo 'Generating documentation...' . chr(13) . chr(10);
  
  $natural_docs_params = array();
  
  array_push($natural_docs_params, '-r'); // Rebuild
  array_push($natural_docs_params, '-i ' . constant('PROTO_SOURCE_DIR')); // Input our source
  array_push($natural_docs_params, '-o HTML ' . constant('PROTO_DOCS_DIR')); // Output to docs
  array_push($natural_docs_params, '-p ' . constant('PROTO_DOCS_DIR') . '/config'); // Project directory
  array_push($natural_docs_params, '-cs \'UTF-8\''); // Set character set
  
  $exec_output = array();
  exec('perl ' . constant('PROTO_LIB_DIR') . '/naturaldocs/NaturalDocs ' . join(' ', $natural_docs_params), $exec_output);
  
  foreach ($exec_output as $o)
    echo $o . chr(13) . chr(10);
  
  /***************************************************************************/

  // Now pack the file.
  echo 'Packing proto.js...' . chr(13) . chr(10);
  
  require 'packer.php';

  $protojs = file_get_contents($DIST_PROTO);

  $packer = new JavaScriptPacker($protojs, 'Normal', true, false);

  $header_filename = constant('PROTO_SOURCE_DIR') . '/HEADER';
  $header_contents  = str_replace('%PROTO_VERSION%', constant('PROTO_VERSION'), file_get_contents($header_filename));
  $header_contents .= chr(13) . chr(10) . chr(13) . chr(10);

  file_put_contents($DIST_PROTO_PACK, $header_contents);
  file_put_contents($DIST_PROTO_PACK, $packer->pack(), FILE_APPEND);

  /***************************************************************************/

  // Create a zip with the lastet files.
  echo 'Creating distribution zip files...' . chr(13) . chr(10);
  
  $packedZip = new ZipArchive();
  if ($packedZip->open($DIST_PROTO_PACK_ZIP, ZIPARCHIVE::CREATE))
  {
    $packedZip->addFile($LIB_EFFECTS, 'effects.js');
    $packedZip->addFile($LIB_PROTOTYPE_PACK, 'prototype-pack.js');
    $packedZip->addFile($DIST_PROTO_PACK, 'proto-pack.js');
    $packedZip->close();
  }

  $fullZip = new ZipArchive();
  if ($fullZip->open($DIST_PROTO_ZIP, ZIPARCHIVE::CREATE))
  {
    $fullZip->addFile($LIB_EFFECTS, 'effects.js');
    $fullZip->addFile($LIB_PROTOTYPE, 'prototype.js');
    $fullZip->addFile($DIST_PROTO, 'proto.js');
    $fullZip->close();
  }

  /***************************************************************************/
?>

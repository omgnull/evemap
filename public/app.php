<?php

error_reporting(E_ALL);

try {
    $appPath = realpath(__DIR__ . '/../app') . '/';

    // Configuration
    $config = require_once $appPath . 'config/config.php';

    // Application
    require_once $appPath . 'Application.php';
    require_once $appPath. $config['appClass'] . '.php';

    $app = new $config['appClass']($config);

    // Send response
    $app->handle();

} catch (Exception $e) {
    error_log($e->getMessage());

    header('HTTP/1.1 503 Service Temporarily Unavailable');
    header('Retry-After: 1800');
}
<?php

return array(
    // SilexApplication or PhalconApplication
    'appClass' => 'SilexApplication',
	'database' => array(
        'dsn'      => 'mysql:dbname=evemap;host=127.0.0.1',
		'username' => 'evemap',
		'password' => 'evemap',
        'options'  => array(
            PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES \'UTF8\''
        )
	),
    'generic' => array(
        'scale'             => 100,
        'dbFetchMode'       => PDO::FETCH_OBJ,
        'dbResultModifier'  => 149598000000 * 63241.1,
        'sql'               => file_get_contents(__DIR__ . '/../resources/sql.json')
    )
);

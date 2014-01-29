<?php

return new \Phalcon\Config(array(
	'database' => array(
		'adapter'     => 'Mysql',
		'host'        => '127.0.0.1',
		'username'    => 'evemap',
		'password'    => '13d4dA0315f',
		'dbname'      => 'evemap',
	),
	'application' => array(
		'controllersDir' => __DIR__ . '/../../app/controllers/',
		'modelsDir'      => __DIR__ . '/../../app/models/',
		'viewsDir'       => __DIR__ . '/../../app/views/',
		'pluginsDir'     => __DIR__ . '/../../app/plugins/',
		'libraryDir'     => __DIR__ . '/../../app/library/',
		'cacheDir'       => __DIR__ . '/../../app/cache/',
		'baseUri'        => '/',
	),
    'generic' => array(
        'dbFetchMode'       => Phalcon\Db::FETCH_OBJ,
        'dbResultModifier'  => 149598000 * 63241.1,
    ),
    'files' => array(
        'icons'     => __DIR__ . '/../resources/iconIDs.yaml',
        'graphics'  => __DIR__ . '/../resources/graphicIDs.yaml',
        'types'     => __DIR__ . '/../resources/typeIDs.yaml',
    )
));

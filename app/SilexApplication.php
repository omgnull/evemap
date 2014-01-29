<?php

/**
 * Class PhalconApplication
 */
class SilexApplication extends Application
{
    public function init()
    {
        require_once __DIR__.'/../vendor/autoload.php';
        $this->handler = new Silex\Application();

        $this->handler->get('/api/{slug}', array($this, 'handleApi'));
        $this->handler->error(array($this, 'handleNotFound'));
    }

    public function handle()
    {
        $this->handler->run();
    }

    public function handleNotFound()
    {
        return new Symfony\Component\HttpFoundation\Response('', 404);
    }
}

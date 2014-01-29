<?php

/**
 * Class PhalconApplication
 */
class PhalconApplication extends Application
{
    public function init()
    {
        if (!extension_loaded('phalcon')) {
            throw new \Exception('Phalcon extension not installed. See http://phalconphp.com/en/');
        }

        $this->handler = new Phalcon\Mvc\Micro();
        $this->handler
            ->getRouter()
            ->setUriSource(Phalcon\Mvc\Router::URI_SOURCE_SERVER_REQUEST_URI);

        $this->handler->notFound(array($this, 'handleNotFound'));
        $this->handler->get('/api/{slug}', array($this, 'handleApi'));
    }

    public function handle()
    {
        $this->handler->handle();
    }

    public function handleApi($slug) {
        echo parent::handleApi($slug);
    }

    public function handleNotFound()
    {
        $this->handler
            ->response
            ->setStatusCode(404, "Not Found")
            ->sendHeaders();
    }
}
<?php

/*
* class Application
*/
abstract class Application
{
    /**
     * @var stdClass
     */
    protected $handler;

    /**
     * @var PDO
     */
    protected $db;

    /**
     * @var GenericModel
     */
    protected $model;

    /**
     * @var array
     */
    protected $config;

    public function __construct($config)
    {
        $this->config = $config;

        // Initialize database connection
        $this->db = new PDO(
            $this->config['database']['dsn'],
            $this->config['database']['username'],
            $this->config['database']['password'],
            $this->config['database']['options']);

        require_once __DIR__ . '/models/GenericModel.php';
        $this->model = new GenericModel(
            $this->db,
            $this->config['generic']['sql'],
            $this->config['generic']['dbResultModifier'] / $this->config['generic']['scale'],
            $this->config['generic']['dbFetchMode']);

        $this->init();
    }

    abstract public function init();

    abstract public function handle();

    public function getMethod($action)
    {
        $method = $action . 'Action';

        if (!method_exists($this, $method)) {
            return false;
        }

        return $method;
    }

    public function handleApi($slug)
    {
        if (!$method = $this->getMethod($slug)) {
            return $this->handleNotFound();
        }

        $response = call_user_func(array($this, $method));

        return empty($response) ?
            '' : json_encode($response, JSON_NUMERIC_CHECK);
    }

    abstract public function handleNotFound();

    protected function regionsAction()
    {
        return $this->model->getRegions();
    }

    protected function systemsAction()
    {
        return $this->model->getSystems();
    }

    protected function jumpsAction()
    {
        return $this->model->getJumps();
    }

    protected function constellationsAction()
    {
        return $this->model->getConstellations();
    }

    protected function factionsAction()
    {
        return $this->model->getFactions();
    }

    protected function landmarksAction()
    {
        return $this->model->getLandmarks();
    }
} 
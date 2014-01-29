<?php

class GenericModel
{
    /**
     * Database connection
     *
     * @var PDO
     */
    private $db;

    /**
     * Modifier for all sql queries
     *
     * @var integer
     */
    private $modifier;

    /**
     * Database result fetch mode
     *
     * @var integer
     */
    private $fetchMode;

    /**
     * All sql queries
     *
     * @var array
     */
    private $sql;

    public function __construct($db, $sql, $modifier, $fetchMode)
    {
        // Inject connection
        $this->db = $db;

        // SQL queries
        $this->sql = json_decode($sql, true);

        // Default value LY
        $this->modifier = $modifier;

        // Default database result fetch mode
        $this->fetchMode = $fetchMode;
    }

    /**
     * Update sql modifier
     *
     * @param $modifier
     */
    public function setModifier($modifier)
    {
        $this->modifier = $modifier;
    }

    /**
     * Update database result fetch mode
     *
     * @param integer $fetchMode
     */
    public function setFetchMode($fetchMode)
    {
        $this->fetchMode = $fetchMode;
    }

    /**
     * Get result of all sql queries
     *
     * @var integer $fetchMode
     *
     * @return array
     */
    public function &getDump()
    {
        $dump = array();
        foreach ($this->sql as $index => &$query) {
            $dump[$index] = $this->getQueryResult($query);
        }

        return $dump;
    }

    public function &getRegions()
    {
        return $this->getResult('regions');
    }

    public function &getConstellations()
    {
        return $this->getResult('constellations');
    }

    public function &getSystems()
    {
        return $this->getResult('systems');
    }

    public function &getJumps()
    {
        return $this->getResult('jumps');
    }

    public function &getFactions()
    {
        return $this->getResult('factions');
    }

    public function &getLandmarks()
    {
        return $this->getResult('landmarks');
    }

    protected function &getResult($queryIndex)
    {
        if (!isset($this->sql[$queryIndex])) {
            throw new Exception(sprintf('Query index "%s" not exists.', $queryIndex));
        }

        if (is_array($this->sql[$queryIndex])) {
            $this->sql[$queryIndex] = implode($this->sql[$queryIndex]);
        }

        return $this->getQueryResult($this->sql[$queryIndex]);
    }

    protected function &getQueryResult($query)
    {
        $sth = $this->db->prepare($query);

        if (false !== strpos($query, 'modifier')) {
            $sth->bindParam(':modifier', $this->modifier, PDO::PARAM_INT);
        }

        $sth->execute();
        $data = $sth->fetchAll($this->fetchMode);

        return $data;
    }
} 
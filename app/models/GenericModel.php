<?php

class GenericModel
{
    /**
     * Database connection
     *
     * @var Phalcon\Db\Adapter\Pdo\Mysql
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
    private $sql = array(
        /* regions */
        'regions'           => '
            SELECT
                `regionID` AS `uid`,
                `regionName` AS `name`,
                round(`x`) / :modifier AS `x`,
                round(`y`) / :modifier AS `y`,
                round(`z`) / :modifier AS `z`,
                round(`radius`) / :modifier AS `radius`
            FROM
                `mapRegions`
            WHERE
                `regionID` < 11000000
            ORDER BY
                `regionID` ASC
        ',
        /* constellations */
        'constellations'    => '
            SELECT
                `constellationID` AS `uid`,
                `constellationName` AS `name`,
                `regionID`, `factionID`,
                round(`x`) / :modifier AS `x`,
                round(`y`) / :modifier AS `y`,
                round(`z`) / :modifier AS `z`,
                round(`radius`) / :modifier AS `radius`
            FROM
                `mapConstellations`
            WHERE
                `regionID` < 11000000
            ORDER BY
                `regionID` ASC, `constellationID` ASC
        ',
        /* systems */
        'systems'           => '
            SELECT
                `solarSystemID` AS `uid`,
                `solarSystemName` AS `name`,
                `regionID`, `constellationID`,
                `sunTypeID`, `luminosity`, `security`,
                round(`x`) / :modifier AS `x`,
                round(`y`) / :modifier AS `y`,
                round(`z`) / :modifier AS `z`,
                round(`radius`) / :modifier AS `radius`
            FROM
                `mapSolarSystems`
            WHERE
                `regionID` < 11000000
            ORDER BY
                `regionID` ASC, `constellationID` ASC, `solarSystemID` ASC
        ',
        /* jumps */
        'jumps'             => '
            SELECT
                `fromSolarSystemID`, `toSolarSystemID`,
                `fromRegionID`, `toRegionID`,
                `fromConstellationID`, `toConstellationID`
            FROM
                `mapSolarSystemJumps`
            ORDER BY
                `fromRegionID`, `fromConstellationID`, `fromSolarSystemID`
        ',
        /* factions */
        'factions'          => '
            SELECT
                `factionID` AS `uid`,
                `factionName` AS `name`,
                `description`, `solarSystemID`,
                `corporationID`
            FROM
                chrFactions

        ',
        /* landmarks */
        'landmarks'         => '
            SELECT
                `landmarkID` AS `uid`,
                `landmarkName` AS `name`,
                `description`,
                round(`x`) / :modifier AS `x`,
                round(`y`) / :modifier AS `y`,
                round(`z`) / :modifier AS `z`
            FROM
                `mapLandmarks`
            ORDER BY
                importance DESC
        '
    );

    public function __construct($db, $modifier, $fetchMode)
    {
        // Inject connection
        $this->db = $db;

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
            throw new \Phalcon\Exception(sprintf('Query index "%s" not exists.', $queryIndex));
        }

        return $this->getQueryResult($this->sql[$queryIndex]);
    }

    protected function &getQueryResult($query)
    {
        if (false !== strpos($query, 'modifier')) {
            $result = $this->db->query($query, array(
                'modifier' => $this->modifier
            ), array(
                'modifier' => Phalcon\Db\Column::BIND_PARAM_INT
            ));
        } else {
            $result = $this->db->query($query);
        }

        $data = $result->fetchAll();

        return $data;
    }
} 
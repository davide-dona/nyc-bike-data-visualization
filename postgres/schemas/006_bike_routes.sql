CREATE TABLE IF NOT EXISTS bike_routes (
    segmentid           INTEGER      NOT NULL,
    bikeid              INTEGER      NOT NULL,
    status              VARCHAR(20)  NOT NULL,
    installation_date   DATE         NOT NULL,
    retired_date        DATE,
    the_geom            TEXT         NOT NULL,
    street              VARCHAR(500) NOT NULL,
    fromstreet          VARCHAR(500),
    tostreet            VARCHAR(500),
    facilitycl          VARCHAR(5)   NOT NULL,
    boro                VARCHAR(20),
    PRIMARY KEY (segmentid, installation_date, status)
);

ALTER TABLE bike_routes ALTER COLUMN fromstreet DROP NOT NULL;
ALTER TABLE bike_routes ALTER COLUMN tostreet   DROP NOT NULL;
-- Create the users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the urls table
CREATE TABLE urls (
    id SERIAL PRIMARY KEY,
    short_url VARCHAR(255) UNIQUE NOT NULL,
    long_url VARCHAR(2048) NOT NULL,
    user_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the hostnames table
CREATE TABLE hostnames (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);
-- Insert a record into the hostnames table for unknown hostnames
INSERT INTO hostnames (name) VALUES ('unknown');

-- Create the ip_addresses table
CREATE TABLE ip_addresses (
    id SERIAL PRIMARY KEY,
    address VARCHAR(45) UNIQUE NOT NULL
);
-- Insert a record into the ip_addresses table for unknown ip_addresses
INSERT INTO ip_addresses (address) VALUES ('unknown');

-- Create the clicks table
CREATE TABLE clicks (
    id SERIAL PRIMARY KEY,
    url_id INT REFERENCES urls(id) ON DELETE CASCADE,
    ip_address_id INT REFERENCES ip_addresses(id),
    hostname_id INT REFERENCES hostnames(id),
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

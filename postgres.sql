-- Create the users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a record into the users table for the default unknown user
INSERT INTO users (username, email) VALUES ('unknown', 'unknown@example.com');

-- Create the urls table
CREATE TABLE urls (
    id SERIAL PRIMARY KEY,
    short_url VARCHAR(255) UNIQUE NOT NULL,
    long_url VARCHAR(2048) NOT NULL,
    user_id INT REFERENCES users(id),
    ip_address_id INT REFERENCES ip_addresses(id),
    hostname_id INT REFERENCES hostnames(id),
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

-- Insert a record into the ip_addresses table for unknown IP addresses
INSERT INTO ip_addresses (address) VALUES ('unknown');

-- Create the clicks table
CREATE TABLE clicks (
    id SERIAL PRIMARY KEY,
    url_id INT REFERENCES urls(id) ON DELETE CASCADE,
    ip_address_id INT REFERENCES ip_addresses(id),
    hostname_id INT REFERENCES hostnames(id),
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key columns to the urls table
ALTER TABLE urls
ADD COLUMN ip_address_id INT REFERENCES ip_addresses(id),
ADD COLUMN hostname_id INT REFERENCES hostnames(id);

-- Add unique constraints to the urls table
ALTER TABLE urls
ADD CONSTRAINT unique_short_url UNIQUE (short_url),
ADD CONSTRAINT unique_long_url UNIQUE (long_url);

-- Add unique constraints to the users table
ALTER TABLE users
ADD CONSTRAINT unique_username UNIQUE (username),
ADD CONSTRAINT unique_email UNIQUE (email);

-- Add unique constraints to the hostnames table
ALTER TABLE hostnames
ADD CONSTRAINT unique_hostname_name UNIQUE (name);

-- Add unique constraints to the ip_addresses table
ALTER TABLE ip_addresses
ADD CONSTRAINT unique_ip_address UNIQUE (address);



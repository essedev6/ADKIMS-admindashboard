-- Create database if not exists
CREATE DATABASE IF NOT EXISTS hotspot_billing;

-- Connect to the database
\c hotspot_billing;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (name, email, status) VALUES
    ('John Doe', 'john@example.com', 'active'),
    ('Jane Smith', 'jane@example.com', 'active'),
    ('Bob Wilson', 'bob@example.com', 'inactive');

INSERT INTO payments (user_id, name, amount, timestamp) VALUES
    (1, 'John Doe', 100.00, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (2, 'Jane Smith', 150.00, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (1, 'John Doe', 75.00, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    (3, 'Bob Wilson', 200.00, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    (2, 'Jane Smith', 125.00, CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Create function for dashboard changes notification
CREATE OR REPLACE FUNCTION notify_dashboard_changes()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('dashboard_changes', 'changed');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payments table
CREATE TRIGGER payments_notify_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION notify_dashboard_changes();
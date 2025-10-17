const { Client } = require('pg');

async function setupDatabase() {
  // Connect to default postgres database to create our database
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres', // Connect to default database first
    password: '', // Try empty password first
    port: 5432,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Create database if it doesn't exist
    try {
      await client.query('CREATE DATABASE hackathon_lms');
      console.log('Database hackathon_lms created successfully');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Database hackathon_lms already exists');
      } else {
        console.error('Error creating database:', err.message);
      }
    }

    await client.end();
    
    // Now connect to our database and create tables
    const appClient = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'hackathon_lms',
      password: '',
      port: 5432,
    });

    await appClient.connect();
    console.log('Connected to hackathon_lms database');

    // The tables will be created by Drizzle ORM when we run the app
    console.log('Database setup completed successfully');
    await appClient.end();
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err.message);
    
    // Try with a different approach
    console.log('Trying with default password...');
    const client2 = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres',
      password: 'postgres', // Try default password
      port: 5432,
    });

    try {
      await client2.connect();
      console.log('Connected to PostgreSQL with default password');
      
      // Create database if it doesn't exist
      try {
        await client2.query('CREATE DATABASE hackathon_lms');
        console.log('Database hackathon_lms created successfully');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('Database hackathon_lms already exists');
        } else {
          console.error('Error creating database:', err.message);
        }
      }
      
      await client2.end();
    } catch (err2) {
      console.error('Error connecting with default password:', err2.message);
    }
  }
}

setupDatabase();
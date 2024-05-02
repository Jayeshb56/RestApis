const express = require('express');
const { Client } = require('pg');
const fs = require('fs');
const app = express();
const customerData = require('./src/data.json');
const port = 3000;

const client = new Client({
    user: 'postgres',
    password: 'Jayesh@56',
    host: 'localhost',
    port: '5432',
    database: 'SmartConnect',
});

client
    .connect()
    .then(() => {
        console.log('Connected to PostgreSQL database');


    })
    .catch((err) => {
        console.error('Error connecting to PostgreSQL database', err);
    });

app.use(express.json());

app.get('/api/customer', (req, res) => {
    return res.json(customerData);
});

app.get('/api/customer/:Customer_ID', (req, res) => {
    const customerId = Number(req.params.Customer_ID);
    const customer = customerData.find((customer) => customer.Customer_ID === customerId);
    if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
    }
    return res.json(customer);
});

app.post('/api/customer', (req, res) => {
    const { firstName, lastName, email, mobileNumber, address, pincode } = req.body;


    // Validation
    if (!firstName || !lastName || !email || !mobileNumber || !address || !pincode) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Regular expression for validating email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    // Regular expression for validating mobile number with country code
    const mobileRegex = /^\+\d{1,3}\d{6,14}$/;
    if (!mobileRegex.test(mobileNumber)) {
        return res.status(400).json({ message: 'Invalid mobile number format' });
    }

    // Regular expression for validating pincode
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) {
        return res.status(400).json({ message: 'Invalid pincode format' });
    }

    // Generate new customer ID
    // const newCustomerId = customerData.length > 0 ? customerData[customerData.length - 1].Customer_ID + 1 : 1;
    const newCustomerId = customerData.length ? customerData[customerData.length - 1].Customer_ID + 1 : 1;


    // Add new customer to the array
    const newCustomer = {
        Customer_ID: newCustomerId,
        firstName,
        lastName,
        email,
        mobileNumber,
        address,
        pincode
    };
    customerData.push(newCustomer);



    // Insert query
    const insertQuery = `
   INSERT INTO customer_details (customer_id, firstname, lastname, email, mobile_number, address, pincode) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *;
    `;


    // Values to insert

    const values = [newCustomerId, firstName, lastName, email, mobileNumber, address, pincode];
    console.log("values :", values)

    // Execute the insert query
    client.query(insertQuery, values)

        // client.query(query)
        .then(result => {
            console.log('Inserted row:', result.rows[0]);
            const newCustomer = result.rows[0];
            res.status(201).json({ message: 'Customer created successfully', customer: newCustomer });
        })
        .catch(error => {
            console.error('Error inserting customer into database', error);
            res.status(500).json({ message: 'Error saving customer data' });
        });
});

app.listen(port, () => console.log(`app is listening on port ${port}`));

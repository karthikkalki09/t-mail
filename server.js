const express = require('express');
const app = express();
const port = 3000;

// Serve static files from the frontend folder
app.use(express.static('../frontend'));

// Basic route
app.get('/api/products', (req, res) => {
  const products = [
    { id: 1, name: 'T-Shirt', price: 439.99 },
    { id: 2, name: 'Sweatshirt', price: 499.99 }
  ];
  res.json(products);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
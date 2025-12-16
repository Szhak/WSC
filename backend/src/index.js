const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const cartRoutes = require("./routes/cartRoutes");
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require("./routes/chatRoutes");
const googleBookRoutes = require('./routes/bookRoutes');



const app = express();
const PORT = process.env.PORT ;
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use("/api/chat", chatRoutes);
app.use('/api/bookRoutes', bookRoutes, googleBookRoutes); 
app.use("/api/cart", cartRoutes);


app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});


if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;

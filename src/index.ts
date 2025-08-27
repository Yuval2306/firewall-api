import express from 'express';
import firewallRoutes from './routes/firewallRoutes';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api', firewallRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Firewall API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
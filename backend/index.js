require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dbRoutes = require('./routes/routes');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(morgan());
app.use(express.json());

app.use('/api', dbRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
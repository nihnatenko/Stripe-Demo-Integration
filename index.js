const express = require("express");
const app = express();
const stripe = require('./routes/handler');
const port = 3000;

app.use(express.json());

app.use("/API/", stripe);

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});

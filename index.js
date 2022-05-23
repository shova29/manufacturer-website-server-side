const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nl7jm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
client.connect((err) => {
  const userCollection = client.db("bicycle-manufacturer").collection("users");
  // perform actions on the collection object
  client.close();
});

app.get("/", (req, res) => {
  res.send("Winged Wheels Bicycle Manufacturer Running");
});

app.listen(port, () => {
  console.log(`Winged Wheels Listening to Port ${port}`);
});

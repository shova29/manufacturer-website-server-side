const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nl7jm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Bicycle DB");
    const userCollection = client
      .db("bicycle-manufacturer")
      .collection("users");
    const partCollection = client
      .db("bicycle-manufacturer")
      .collection("parts");
    const purchaseCollection = client
      .db("bicycle-manufacturer")
      .collection("purchases");

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1day" }
      );
      res.send({ result, token });
    });

    // Part API
    app.get("/part", async (req, res) => {
      const query = {};
      const cursor = partCollection.find(query).sort({ _id: -1 }).limit(6);
      const parts = await cursor.toArray();
      res.send(parts);
    });

    // Part Details API
    app.get("/part/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const part = await partCollection.findOne(query);
      res.send(part);
    });

    // Purchase API
    app.post("/purchase", async (req, res) => {
      const purchase = req.body;
      const result = await purchaseCollection.insertOne(purchase);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Winged Wheels Bicycle Manufacturer Running");
});

app.listen(port, () => {
  console.log(`Winged Wheels Listening to Port ${port}`);
});

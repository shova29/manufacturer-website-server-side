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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

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
    const reviewCollection = client
      .db("bicycle-manufacturer")
      .collection("reviews");

    //VerifyAdmin Bearer Api
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "Forbidden Access" });
      }
    };

    //User Get Api
    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    //User Put Api
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

    //Admin Get Api
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    //Admin Put Api
    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //Profile Put Api
    app.put("/profiles/:email", async (req, res) => {
      const email = req.params.email;
      const profile = req.body;
      console.log(profile);
      const filter = { email: email };
      const updatedDoc = {
        $set: profile,
      };
      const updatedProfile = await userCollection.updateOne(filter, updatedDoc);
      console.log(updatedProfile);
      res.send(updatedProfile);
    });

    // Part Get API
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

    // Part Post API
    app.post("/part", verifyJWT, verifyAdmin, async (req, res) => {
      const part = req.body;
      const result = await partCollection.insertOne(part);
      res.send(result);
    });

    //Products Get Api for Manage Products
    app.get("/products", verifyJWT, verifyAdmin, async (req, res) => {
      const query = {};
      const products = await partCollection.find(query).toArray();
      res.send(products);
    });

    //Products Delete Api for Manage Products
    app.delete("/products/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await partCollection.deleteOne(filter);
      res.send(result);
    });

    // Purchase API
    app.post("/purchase", verifyJWT, async (req, res) => {
      const purchase = req.body;
      const result = await purchaseCollection.insertOne(purchase);
      res.send(result);
    });

    // Reviews POST API
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
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

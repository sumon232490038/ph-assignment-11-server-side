require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xhl2h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const txDatabase = client.db("tutorXpressDB").collection("tutorials");
    const usersDatabase = client.db("tutorXpressDB").collection("users");
    const bookedDatabase = client
      .db("tutorXpressDB")
      .collection("bookedTutorials");

    app.post("/tutorXpress/users", async (req, res) => {
      const email = req?.query?.email;
      const NewUser = {
        email: email,
      };
      const result = await usersDatabase.insertOne(NewUser);
      console.log(result);
      res.send(result);
    });
    app.post("/addTutorials", async (req, res) => {
      const tutorial = req?.body;
      const result = await txDatabase.insertOne(tutorial);
      res.send(result);
    });

    app.get("/myTutorials", async (req, res) => {
      const userEamil = req?.query?.email;
      let filter = {};
      if (userEamil) {
        filter = { email: userEamil };
      }
      const find = txDatabase.find(filter);
      const result = await find.toArray();
      res.send(result);
    });

    app.delete("/myTutorials/delete/:id", async (req, res) => {
      const id = req?.params?.id;
      const query = { _id: new ObjectId(id) };
      const result = await txDatabase.deleteOne(query);
      res.send(result);
    });
    app.delete("/bookedTutor/delete/:id", async (req, res) => {
      const id = req?.params?.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookedDatabase.deleteOne(query);
      res.send(result);
    });
    app.get("/tutorialBy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await txDatabase.findOne(query);
      res.send(result);
    });
    app.get("/tutor/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await txDatabase.findOne(query);
      res.send(result);
    });

    app.post("/updateTutorial/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: data.name,
          email: data.email,
          photoUrl: data.photoUrl,
          price: data.price,
          review: data.review,
          language: data.language,
          descripiton: data.descripiton,
          tutorialName: data.tutorialName,
        },
      };
      const result = await txDatabase.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.get("/find-tutors", async (req, res) => {
      const result = await txDatabase.find({}).toArray();
      res.send(result);
    });
    app.get("/find-tutors/category", async (req, res) => {
      const texts = req.query.language;
      const lowerCase = texts.toLowerCase();
      const query = { language: lowerCase };
      const result = await txDatabase.find(query).toArray();
      res.send(result);
    });

    app.post("/myBookedTutors", async (req, res) => {
      const data = req.body;
      const result = await bookedDatabase.insertOne(data);
      res.send(result);
    });
    app.get("/myBookedTutors/page", async (req, res) => {
      const email = req.query.email;

      let filter = {};
      if (email) {
        filter = { userEmail: email };
      }
      const find = bookedDatabase.find(filter);
      const result = await find.toArray();
      res.send(result);
    });

    app.post("/tutor/review/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $inc: { review: 1 },
      };
      const options = { upsert: true };
      const result = await txDatabase.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.get("/totalTutor", async (req, res) => {
      const count = await txDatabase.estimatedDocumentCount();
      const userCount = await usersDatabase.estimatedDocumentCount();
      const find = txDatabase.find();
      const result = await find.toArray();
      let sum = 0;
      const reviewCount = result.map(
        (tutor) => (sum = sum + parseInt(tutor.review))
      );
      // console.log(result);

      res.send({ count, userCount, sum });
    });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("TutorXpress........!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

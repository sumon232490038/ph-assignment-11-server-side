require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ph-assignment-11-e59b9.web.app",
      "https://ph-assignment-11-e59b9.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xhl2h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log(token);
  if (!token) {
    res.status(401).send({ message: "Sorry the token is not created!" });
    return;
  }
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      res
        .status(401)
        .send({ message: "sorry bro there is some problem in token" });
      return;
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    const txDatabase = client.db("tutorXpressDB").collection("tutorials");
    const usersDatabase = client.db("tutorXpressDB").collection("users");
    const bookedDatabase = client
      .db("tutorXpressDB")
      .collection("bookedTutorials");

    app.post("/jwt", (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.SECRET_KEY, {
        expiresIn: "5h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/jwt/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/tutorXpress/users", async (req, res) => {
      const email = req?.query?.email;
      const NewUser = {
        email: email,
      };
      const result = await usersDatabase.insertOne(NewUser);

      res.send(result);
    });
    app.post("/addTutorials", verifyToken, async (req, res) => {
      const tutorial = req?.body;
      const userNewEamil = req?.user?.email;

      if (userNewEamil !== tutorial.email) {
        res.status(403).send({ message: "sorry you are forbidden parson" });
      }
      const result = await txDatabase.insertOne(tutorial);
      res.send(result);
    });

    app.get("/myTutorials", verifyToken, async (req, res) => {
      const userNewEamil = req?.user?.email;
      const userEamil = req?.query?.email;

      if (userNewEamil !== userEamil) {
        res.status(403).send({ message: "sorry you are forbidden parson" });
      }

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

    app.post("/updateTutorial/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const userNewEamil = req?.user?.email;

      if (userNewEamil !== data.email) {
        res.status(403).send({ message: "sorry you are forbidden parson" });
      }

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

    app.post("/myBookedTutors/added", verifyToken, async (req, res) => {
      const data = req?.body;
      const userNewEamil = req?.user?.email;

      if (userNewEamil !== data.userEmail) {
        res.status(403).send({ message: "sorry you are forbidden parson" });
        return;
      }
      const result = await bookedDatabase.insertOne(data);
      res.send(result);
    });
    app.get("/myBookedTutors/page", verifyToken, async (req, res) => {
      const email = req?.query?.email;
      if (req?.user?.email !== email) {
        res.status(403).send({ message: "sorry vai mafkoren" });
        return;
      }
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

      res.send([{ count, userCount, sum }]);
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

// Imports
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Middlewares
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6cq5lj6.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // await client.connect();

        // Collections
        const usersCollection = client.db("contestHubDB").collection("users");
        const contestsCollection = client
            .db("contestHubDB")
            .collection("contests");

        // Contests Related Api
        app.get("/contests", async (req, res) => {
            const result = await contestsCollection.find().toArray();
            res.send(result);
        });

        app.delete("/contests/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await contestsCollection.deleteOne(query);
            res.send(result);
        });

        app.get("/contests/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await contestsCollection.findOne(query);
            res.send(result);
        });

        app.get("/top-contests", async (req, res) => {
            const topContest = contestsCollection
                .find()
                .sort({ participantsCount: -1 });
            const result = (await topContest.toArray()).slice(0, 5);
            res.send(result);
        });

        app.get("/top-winner", async (req, res) => {
            const topContest = contestsCollection
                .find()
                .sort({ participantsCount: -1 });
            const result = (await topContest.toArray()).slice(0, 3);
            res.send(result);
        });

        // Users Related API
        app.post("/users", async (req, res) => {
            const newUser = req.body;
            const query = { userEmail: newUser.userEmail };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({
                    message: "User Already Exist",
                    insertedId: null,
                });
            }
            const result = await usersCollection.insertOne(newUser);
            res.send(result);
        });

        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            const user = await usersCollection.findOne(query);
            if (user?.role === "admin") {
                return res.send({ role: "admin" });
            } else if (user?.role === "creator") {
                return res.send({ role: "creator" });
            } else {
                return res.send({ role: "user" });
            }
        });

        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });

        app.get("/users", async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        // Payments Intent
        app.post("/create-payment-intent", async (req, res) => {
            const { fee } = req.body;
            const amount = parseInt(fee * 100);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"],
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        // await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Server is Running");
});

app.listen(port, () => {
    console.log(`Server Is Running On Port ${port}`);
});

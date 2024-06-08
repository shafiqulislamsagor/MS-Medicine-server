const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_KEY);
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://sm-medicine.web.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

//   Maddleware requires
// Verify Token Middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log(token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//   Mongodb server

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ms-creator.yqb9vtj.mongodb.net/?retryWrites=true&w=majority&appName=ms-creator`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const All_User = client.db("SM-Medicine").collection("all-users");
    const All_Category = client.db("SM-Medicine").collection("all-category");
    const All_Products = client.db("SM-Medicine").collection("all-products");
    const Buy_Products = client.db("SM-Medicine").collection("buy-products");
    const Payment_Products = client
      .db("SM-Medicine")
      .collection("Payment-products");

    // All-users
    app.get("/users", async (req, res) => {
      const users = await All_User.find().toArray();
      res.status(200).send(users);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const newUser = await All_User.insertOne(user);
      res.status(200).send(newUser);
    });

    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;
      console.log(id, role);
      const query = { _id: new ObjectId(id) };
      const update = { $set: { userRole: role } };
      const result = await All_User.updateOne(query, update);
      res.status(200).send({ message: "success" });
    });
    app.patch("/user/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      console.log(status);
      console.log(id, status);
      const query = { _id: new ObjectId(id) };
      const update = { $set: { status: status } };
      const result = await All_User.updateOne(query, update);
      res.status(200).send(result);
    });

    // Product

    app.get("/product-counts", async (req, res) => {
      const productcount = await All_Products.countDocuments();
      res.send({ productcount });
    });

    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const products = await All_Products.find()
        .skip((page - 1) * size)
        .limit(size)
        .toArray();
      res.status(200).send(products);
    });
    app.get('/category-all/:category', async (req, res) => {
      const categorys = req.params.category;
      console.log(categorys);
      const quary = { category: categorys };
      const result = await All_Products.find(quary).toArray();
      res.status(200).send(result);
    })
    app.get("/dynamic-banner", async (req, res) => {
      const quary = {
        advirtise: "true",
      };
      const products = await All_Products.find(quary).toArray();
      res.status(200).send(products);
    });
    app.get("/products-adrequest", async (req, res) => {
      const quary = { ad: "requested" };
      const products = await All_Products.find(quary).toArray();
      res.status(200).send(products);
    });
    app.patch("/products-adrequest/:id", async (req, res) => {
      const id = req.params.id;
      const { toogleValue } = req.body;
      const value = toogleValue ? "true" : "false";
      const query = { _id: new ObjectId(id) };
      const update = { $set: { advirtise: value } };

      const result = await All_Products.updateOne(query, update);
      res.status(200).send(result);
    });
    app.get("/products/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const quaryes = { "seller.email": email };
      const products = await All_Products.find(quaryes).toArray();
      res.status(200).send(products);
    });

    app.patch("/products-request/:id", async (req, res) => {
      const id = req.params.id;
      const { ad } = req.body;
      console.log(id, ad);
      const query = { _id: new ObjectId(id) };
      const update = { $set: { ad } };
      const result = await All_Products.updateOne(query, update);
      res.status(200).send(result);
    });

    app.post("/products", async (req, res) => {
      const product = req.body;
      const newProduct = await All_Products.insertOne(product);
      res.status(200).send(newProduct);
    });

    // buy products

    app.get("/buy-products", async (req, res) => {
      const products = await Buy_Products.find().toArray();
      res.status(200).send(products);
    });

    app.post("/buy-products", async (req, res) => {
      const product = req.body;
      const newProduct = await Buy_Products.insertOne(product);
      res.status(200).send(newProduct);
    });

    app.delete("/buy-products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { productId: id };
      const result = await Buy_Products.deleteOne(query);
      res.status(200).send(result);
    });

    app.delete("/buy-product/delete", async (req, res) => {
      const result = await Buy_Products.deleteMany({});
      res.status(200).send(result);
    });

    // payment Products
    app.get("/payments-products", async (req, res) => {
      const products = await Payment_Products.find().toArray();
      res.status(200).send(products);
    });

    app.patch("/payments-products/:id", async (req, res) => {
      const id = req.params.id;
      const { paid } = req.body;
      // console.log(id,paid)
      const query = { _id: new ObjectId(id) };
      const update = { $set: { status: paid } };
      const result = await Payment_Products.updateOne(query, update);
      res.status(200).send(result);
    });

    app.get("/payment-see-seller/:email", async (req, res) => {
      const email = req.params.email;
      const quaryes = { "product.seller.email": email };
      const products = await Payment_Products.find(quaryes).toArray();
      res.status(200).send(products);
    });

    app.get("/payments-products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { transactionId: id };
      const products = await Payment_Products.find(query).toArray();
      res.status(200).send(products);
    });

    app.post("/payments-products", async (req, res) => {
      const product = req.body;
      const newProduct = await Payment_Products.insertOne(product);
      res.status(200).send(newProduct);
    });
    // Category
    app.get("/category-all", async (req, res) => {
      const category = await All_Category.find().toArray();
      res.status(200).send(category);
    });
    
    app.post("/category-all", async (req, res) => {
      const data = req.body;
      const category = await All_Category.insertOne(data);
      res.status(200).send(category);
    });
    app.delete("/category-all/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const category = await All_Category.deleteOne(quary);
      res.status(200).send(category);
    });
    app.patch("/category-all/:id", async (req, res) => {
      const id = req.params.id;
      const {categoryProduct} = req.body;
      const {name , img} = categoryProduct
      const query = { _id: new ObjectId(id) };
      const update = { $set: { name, img } };
      const result = await All_Category.updateOne(query, update);
      res.status(200).send(result);
       
    });

    // Payment intent
    app.post("/create-payment", async (req, res) => {
      const price = req.body.price;
      console.log(price);
      const centConverted = parseInt(price) * 100;
      if (!price || centConverted < 1) {
        return res.status(400).send({ error: "Invalid price" });
      }

      try {
        // Generate clientSecret
        const { client_secret } = await stripe.paymentIntents.create({
          amount: centConverted,
          currency: "usd",
          automatic_payment_methods: {
            enabled: true,
          },
        });
        console.log("hit");
        console.log(client_secret);

        // Send client secret as response
        res.send({ clientSecret: client_secret });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).send({ error: "Failed to create payment intent" });
      }
    });

    // JWT emplementation
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "500d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
    app.get("/jwt-logout", async (req, res) => {
      try {
        res
          .clearCookie("token", {
            maxAge: 0,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          })
          .send({ success: true });
      } catch (err) {
        res.status(500).send(err);
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("listening on port", port);
});

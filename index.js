const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
// const nodemailer = require('nodemailer')
const cookieParser = require('cookie-parser')
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 5000


const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    optionSuccessStatus: 200,
  }
  app.use(cors(corsOptions))
  
  app.use(express.json())
  app.use(cookieParser())

//   Maddleware requires
// Verify Token Middleware
const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token
    console.log(token)
    if (!token) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err)
        return res.status(401).send({ message: 'unauthorized access' })
      }
      req.user = decoded
      next()
    })
  }

  app.get('/', (req, res) => {
    res.send('Hello World!')
  })

//   Mongodb server


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ms-creator.yqb9vtj.mongodb.net/?retryWrites=true&w=majority&appName=ms-creator`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const All_User = client.db('SM-Medicine').collection('all-users');

    // All-users 
    app.get('/users',async(req, res) => {
        const users = await All_User.find().toArray();
        res.status(200).send(users);
    })

    app.post('/users', async(req, res) => {
        const user = req.body
        const newUser = await All_User.insertOne(user);
        res.status(200).send(newUser);
    })

    app.patch('/users/:id', async(req, res) => {
      const id = req.params.id
      const {role} = req.body
      console.log(id , role)
      const query = {_id : new ObjectId(id)}
      const update = { $set: {userRole: role}}
      const updatedUser = await All_User.updateOne(query, update)
      res.status(200).send({message:'success'})
    })

    // JWT emplementation 
    app.post('/jwt', async (req, res) => {
        const user = req.body
        const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
          expiresIn: '500d',
        })
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
      })
      app.get('/jwt-logout', async (req, res) => {
        try {
          res
            .clearCookie('token', {
              maxAge: 0,
              secure: process.env.NODE_ENV === 'production',
              sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            })
            .send({ success: true })
        } catch (err) {
          res.status(500).send(err)
        }
      })
  
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);


  app.listen(port, ()=>{
    console.log('listening on port',port )
  })

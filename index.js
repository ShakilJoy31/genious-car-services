const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization; 
    if(!authHeader){
        return res.status(401).send({message: 'Unauthorized access'}); 
    }
    const token = authHeader.split(' ')[1]; 
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
            return res.status(403).send({message: 'Forbidden Access'}); 
        }
        req.decoded = decoded; 
        next(); 
    })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bkjf1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const serviseCollection = client.db('geniousCar').collection('service');
        const orderCollection = client.db('geniousCar').collection('order');

        // Auth
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            })
            res.send(accessToken);
        });

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviseCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviseCollection.findOne(query);
            res.send(service);
        })

        // Post data to the database. 
        app.post('/service', async (req, res) => {
            const newService = req.body;
            const result = await serviseCollection.insertOne(newService);
            res.send(result);
        })

        // Delete item 
        app.delete('/service/:id', async (req, res) => {
            console.log('deleted');
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviseCollection.deleteOne(query);
            res.send(result);
        });

        // CRUR operation at OrderCollection database. 
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });
        app.get('/myorder',verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email; 
            const email = req.query.email;
            if(decodedEmail === email){
                const query = { email: email }
                const cursor = orderCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }
            else{
                res.status(403).send({message: 'forbidded access'}); 
            }
        })

    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Running Genious Server');
});
app.listen(port, () => {
    console.log('Listening to the port ', 5000);
})
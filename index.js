const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const res = require('express/lib/response');
const app = express();
const port = process.env.PORT || 5000;

require('dotenv').config()
app.use(cors())
app.use(express.json())

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "unauthorized access" })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.send(403).send({ message: "Forbidden access" })
        }
        console.log(decoded);
        req.decoded = decoded;
        next();
    })

}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const verify = require('jsonwebtoken/verify');
const uri = `mongodb+srv://${process.env.APP_USER}:${process.env.APP_PASS}@cluster0.x22e7.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        await client.connect();
        const productCollection = client.db("bikePro").collection("products");

        // get all Products
        app.get("/product", async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await (await cursor.toArray()).reverse();
            res.send(products);
        })

        //get single product
        app.get("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product);
        })

        //post new product
        app.post('/product', async (req, res) => {
            const newProduct = req.body;
            console.log("Adding new product success", newProduct);
            const result = await productCollection.insertOne(newProduct);
            res.send(result)

        })

        // Update Quantity
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const { quantity } = req.body
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: quantity,

                }
            };
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        // update all product information
        app.put('/productInfo/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const { product_name, quantity, price, picture } = req.body
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    product_name: product_name,
                    quantity: quantity,
                    price: price,
                    picture: picture,
                }
            };
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        // Delete Product

        app.delete("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })


        //get my product
        app.get("/myproduct", async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = productCollection.find(query);
                const products = await cursor.toArray();
                res.send(products);
            }
            else {
                res.status(403).send({ message: "Forbidden access" })
            }

        })


        //AUTH 
        app.post('/login', async (req, res) => {
            const user = req.body  //get user information
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })

    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Node server is running");
})
app.listen(port, () => {
    console.log("CRUD server is running");
})

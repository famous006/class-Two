const  express = require("express")
const app = express()
require('ejs')
const dotenv = require("dotenv")
app.set('view engine', 'ejs')
app.use(express.urlencoded({extended:true}))
const mongoose = require('mongoose')
const cors = require('cors')
app.use(cors())
const customerRouter = require('./routes/user.route')
dotenv.config()

app.use(express.json())

const URI = process.env.URI

mongoose.connect(URI)
.then( () => {
    console.log('Connect to MongoDb');
})
.catch((err) => {
    console.log('MongoDb connection error:', err);
    
})


// let customerModel = mongoose.model('User', customerSchema)

let allCustomers = []
app.use('/user', customerRouter)

app.post('/registe', (req, res) =>{
    res.send('Confirmed')
})

const port = process.env.PORT || 3000;
app.listen(port, ()=>{
    console.log("It's Working");
})
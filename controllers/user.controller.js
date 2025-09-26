const customerModel = require('../models/user.model')
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.getSignup = (req, res) => {
    res.render('signup')
}

exports.getDashboard = (req, res) => {
    // customerModel.find()
    //     .then((data) => {
    //         console.log(data);
    //         allCustomers = data;
    //         res.render('index', { allCustomers });
    //     })
    //     .catch((err) => {
    //         console.error('Error fetching customers:', err);
    //         res.status(500).send('Internal server error');
    //     })

    let token = req.headers.authorization.split(" ")[1]
    jwt.verify(token, "secretkey", (err, result) => {
        if (err) {
            console.log(err);
            res.send({status:false, message:"Token is expired or invalid"})
        } else {
            console.log(result);
            let email = result.email
            customerModel.findOne({ email: email })
                .then((foundCustomer) => {
                    res.send({status:true, message: "token is valid", foundCustomer})
                })
            
        }
    });
}

exports.postRegister = (req, res) => {
    let salt = bcrypt.genSaltSync(10)
    let hashedPassword = bcrypt.hashSync(req.body.password, salt)

    req.body.password = hashedPassword
    console.log(req.body);
    // res.send('Confirmed again')
    // allCustomers.push(req.body)
    let newCustomer = new customerModel(req.body);
    newCustomer.save()
        .then(() => {
            newCustomer.password = hashedPassword
            console.log('Customer registered successful');
            


            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'muizsamuel83@gmail.com',
                    pass: 'ztgsegelxnzyalep'
                }
            });

            let mailOptions = {
                from: 'muizsamuel83@gmail.com',
                to: [req.body.email, 'michaeloluwaseyi900@gmail.com', 'killerbeandeadpoolkillerdead@gmail.com'],
                subject: 'Sending Email using Node.js',
                text: 'That was easy!'
                
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            res.redirect('/user/login');
        })
        .catch((err) => {
            console.log('Error registering customer:', err);
        })
}

exports.getLogin = (req, res) => {
    res.render('signin')
}

exports.postSignin = (req, res) => {
    const { email, password } = req.body;

    console.log("Login form submitted data:", req.body);

    customerModel.findOne({ email })
        .then((foundCustomer) => {
            if (!foundCustomer) {
                console.log("Invalid email");
                return res.status(400).json({ message: "Invalid email or password" });
            }

            // Compare provided password with hashed one
            const isMatch = bcrypt.compareSync(password, foundCustomer.password);

            if (!isMatch) {
                console.log("Invalid password");
                return res.status(400).json({ message: "Invalid email or password" });
            }

            // ✅ Success
            console.log("Login successful for:", foundCustomer.email);
            const token = jwt.sign({ email: req.body.email }, "secretkey", { expiresIn: "1h" });
            console.log("Generated JWT:", token);
            return res.json({
                message: "Login successful",
                user: {
                    id: foundCustomer._id,
                    firstName: foundCustomer.firstName,
                    email: foundCustomer.email,
                    token: token
                }
            });
        })

        .catch((err) => {
            console.error("Error logging in:", err);
            res.status(500).json({ message: "Internal server error" });
        });
};

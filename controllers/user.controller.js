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

exports.postSignin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("🟢 Incoming login:", { email, password }); // log what you get

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const user = await customerModel.findOne({ email });
        if (!user) {
            console.log("❌ No user found for email:", email);
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("❌ Password mismatch for:", email);
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // log secret to confirm it's loaded
        console.log("JWT Secret being used:", process.env.JWT_SECRET);

        const token = jwt.sign(
            { email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        console.log("✅ Login successful for:", user.email);

        return res.json({
            message: "Login successful",
            user: {
                id: user._id,
                firstName: user.firstName,
                email: user.email,
                token
            }
        });
    } catch (err) {
        console.error("🔥 Error during signin:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

const jwt = require("jsonwebtoken")

const User = require("../models/User")
const passwordValidator = require("password-validator")
const bcrypt = require("bcrypt")
const mailer = require("../mailer/index")


var schema = new passwordValidator();

// Add properties to it
schema
    .is().min(8)                                    // Minimum length 8
    .is().max(100)                                  // Maximum length 100
    .has().uppercase(1)                             // Must have at least 1 uppercase letter
    .has().lowercase(1)                             // Must have at least 1 lowercase letter
    .has().digits(1)                                // Must have at least 1 digit
    .has().symbols(1)                               // Must have at least 1 special Character
    .has().not().spaces()                           // Should not have spaces
    .is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values

async function createRecord(req, res) {
    if (req.body.password) {
        if (schema.validate(req.body.password)) {
            bcrypt.hash(req.body.password, 12, async (error, hash) => {
                if (error) {
                    res.status(500).send({
                        result: "Fail",
                        reason: "Internal Server Error During Password Encryption"
                    })
                }
                else {
                    try {
                        let data = new User(req.body)
                        if(!(req.body.option))
                        data.role = "Buyer"
                        data.password = hash
                        await data.save()
                        res.send({
                            result: "Done",
                            data: data
                        })

                        mailer.sendMail({
                            from: process.env.MAILER,
                            to: data.email,
                            subject: `Welcome to ${process.env.SITE_NAME} – Signup Successful`,
                            html: `
                                    <tr>
                                    <td style="background-color:#0b3d91; padding:20px; text-align:center;">
                                        <h1 style="color:#ffffff; margin:0; font-size:24px;">${process.env.SITE_NAME}</h1>
                                    </td>
                                    </tr>
                
                                    <tr>
                                    <td style="padding:30px; color:#333333;">
                                        <h2 style="color:#0b3d91; margin-top:0;">Welcome to ${process.env.SITE_NAME} 🎉</h2>
                                        
                                        <p style="font-size:16px; line-height:24px; margin:15px 0;">
                                        Your account has been successfully created! We’re excited to have you join the ${process.env.SITE_NAME} family.
                                        </p>

                                        <p style="font-size:16px; line-height:24px; margin:15px 0;">
                                        You can now explore our latest collections, enjoy exclusive deals, and experience secure and convenient shopping anytime.
                                        </p>

                                        <!-- Button -->
                                        <div style="text-align:center; margin:30px 0;">
                                        <a href="${process.env.SITE_URL}" style="display:inline-block; padding:12px 25px; background-color:#0b3d91; color:#ffffff; text-decoration:none; font-size:16px; border-radius:4px;">
                                            Explore Now
                                        </a>
                                        </div>

                                        <p style="font-size:14px; line-height:22px; color:#555555;">
                                        If you did not create this account, please contact our support team immediately.
                                        </p>

                                        <p style="font-size:16px; margin-top:30px;">
                                        Happy Shopping,<br>
                                        <strong style="color:#0b3d91;">Team ${process.env.SITE_NAME}</strong>
                                        </p>
                                    </td>
                                    </tr>

        
        
                                    <tr>
                                    <td style="background-color:#0b3d91; padding:15px; text-align:center;">
                                        <p style="color:#ffffff; font-size:12px; margin:0;">
                                        © 2026 ${process.env.SITE_NAME}. All Rights Reserved.
                                        </p>
                                    </td>
                                    </tr>
                                                `
                        }, (error) => {
                            if (error)
                                console.log(error)
                        })
                    } catch (error) {
                        let arr = []
                        if (error?.keyValue)
                            arr = Object.keys(error.keyValue).map(key => [key, `${key} Already Taken`])
                        else
                            arr = Object.keys(error?.errors).map(key => [key, error.errors[key].message])
                        let errorMessage = Object.fromEntries(arr)

                        res.status(Object.values(errorMessage).length ? 400 : 500).send({
                            result: "Fail",
                            reason: Object.values(errorMessage).length ? errorMessage : "Internal Server Error"
                        })
                    }
                }
            })
        }
        else {
            res.status(400).send({
                result: "Fail",
                reason: schema.validate(req.body.password, { details: true }).map(x => x.message.replaceAll("string", "Password"))
            })
        }
    }
    else {
        res.send({
            result: "Fail",
            reason: "Password Field is Mendatory"
        })
    }
}

async function getRecord(req, res) {
    try {
        let data = await User.find().sort({ _id: -1 })
        res.send({
            result: "Done",
            count: data.length,
            data: data
        })
    } catch (error) {
        res.send({
            result: "Fail",
            reason: "Internal Server Error"
        })
    }
}

async function getSingleRecord(req, res) {
    try {
        let data = await User.findOne({ _id: req.params._id })
        if (data) {
            res.send({
                result: "Done",
                data: data
            })
        }
        else {
            res.status(404).send({
                result: "Fail",
                reason: "Record Not Found"
            })
        }
    } catch (error) {
        res.status(500).send({
            result: "Fail",
            reason: "Internal Server Error"
        })
    }
}

async function updateRecord(req, res) {
    try {
        let data = await User.findOne({ _id: req.params._id })
        if (data) {
            data.name = req.body.name ?? data.name
            data.username = req.body.username ?? data.username
            data.email = req.body.email ?? data.email
            data.phone = req.body.phone ?? data.phone
            data.role = req.body.role ?? data.role
            data.address = req.body.address ?? data.address
            data.status = req.body.status ?? data.status

            bcrypt.hash(req.body.password, 12, async (error, hash) => {
                if (error) {
                    res.status(500).send({
                        result: "Fail",
                        reason: "Internal Server Error During Password Encryption"
                    })
                }
                else {
                    data.password = hash
                }
            })

            await data.save()
            res.send({
                result: "Done",
                data: data
            })
        }
        else {
            res.status(404).send({
                result: "Fail",
                reason: "Record Not Found"
            })
        }
    } catch (error) {
        let arr = []
        if (error?.keyValue)
            arr = Object.keys(error.keyValue).map(key => [key, `${key} Already Taken`])
        else
            arr = Object.keys(error?.errors).map(key => [key, error.errors[key].message])
        let errorMessage = Object.fromEntries(arr)

        res.status(Object.values(errorMessage).length ? 400 : 500).send({
            result: "Fail",
            reason: Object.values(errorMessage).length ? errorMessage : "Internal Server Error"
        })
    }
}

async function deleteRecord(req, res) {
    try {
        let data = await User.findOne({ _id: req.params._id })
        if (data) {
            await data.deleteOne()
            res.send({
                result: "Done"
            })
        }
        else {
            res.status(404).send({
                result: "Fail",
                reason: "Record Not Found"
            })
        }
    } catch (error) {
        res.status(500).send({
            result: "Fail",
            reason: "Internal Server Error"
        })
    }
}

async function login(req, res) {
    try {
        let data = await User.findOne({
            $or: [
                { username: req.body.username },
                { email: req.body.username },
            ]
        })
        if (data && await bcrypt.compare(req.body.password, data.password)) {
            jwt.sign({ data }, process.env.JWT_SECRET_KEY_PRIVATE, { expiresIn: "15 days" }, (error, token) => {
                if (error) {
                    res.status(500).send({
                        result: "Fail",
                        reason: "Internal Server Error"
                    })
                }
                else {
                    res.send({
                        result: "Done",
                        data: data,
                        token: token
                    })
                }
            })
        }
        else {
            res.status(401).send({
                result: "Fail",
                reason: "Invalid Username or Password"
            })
        }
    } catch (error) {
        // console.log(error)
        res.status(500).send({
            result: "Fail",
            reason: "Internal Server Error"
        })
    }
}

async function forgetPassword1(req, res) {
    try {
        let data = await User.findOne({
            $or: [
                { username: req.body.username },
                { email: req.body.username },
            ]
        })
        if (data) {
            let otp = Math.random().toString().slice(2, 8)
            data.otpAuthObject = {
                otp: otp,
                createdAt: new Date()
            }
            await data.save()
            res.send({
                result: "Done",
                message: "OTP Has Been Sent On Your Registered Email Address"
            })

            mailer.sendMail({
                from: process.env.MAILER,
                to: data.email,
                subject: `OTP for Password Reset : Team ${process.env.SITE_NAME}`,
                html: `
                    <tr>
                    <td style="background-color:#0b3d91; padding:20px; text-align:center;">
                        <h1 style="color:#ffffff; margin:0; font-size:24px;">${process.env.SITE_NAME}</h1>
                    </td>
                    </tr>

                    <tr>
                    <td style="padding:30px; color:#333333;">
                        <h2 style="color:#0b3d91; margin-top:0;">Password Reset Request</h2>
                        <p style="font-size:16px; line-height:24px; margin:15px 0;">
                        We received a request to reset your password. Please use the One-Time Password (OTP) below to proceed with resetting your account password.
                        </p>

                        <!-- OTP Box -->
                        <div style="text-align:center; margin:30px 0;">
                        <span style="display:inline-block; padding:15px 30px; background-color:#0b3d91; color:#ffffff; font-size:24px; letter-spacing:5px; font-weight:bold; border-radius:5px;">
                            ${otp}
                        </span>
                        </div>

                        <p style="font-size:14px; line-height:22px; margin:15px 0; color:#555555;">
                        This OTP is valid for 10 minutes. Do not share this code with anyone for security reasons.
                        </p>

                        <p style="font-size:14px; line-height:22px; margin:15px 0; color:#555555;">
                        If you did not request a password reset, please ignore this email or contact our support team immediately.
                        </p>

                        <p style="font-size:16px; margin-top:30px;">
                        Regards,<br>
                        <strong style="color:#0b3d91;">Team ${process.env.SITE_NAME}</strong>
                        </p>
                    </td>
                    </tr>
                    <tr>
                    <td style="background-color:#0b3d91; padding:15px; text-align:center;">
                        <p style="color:#ffffff; font-size:12px; margin:0;">
                        © 2026 ${process.env.SITE_NAME}. All Rights Reserved.
                        </p>
                    </td>
                    </tr>
                `
            }, (error) => {
                if (error)
                    console.log(error)
            })
        }
        else {
            res.status(401).send({
                result: "Fail",
                reason: "User Not Found"
            })
        }
    } catch (error) {
        res.status(500).send({
            result: "Fail",
            reason: "Internal Server Error"
        })
    }
}

async function forgetPassword2(req, res) {
    try {
        let data = await User.findOne({
            $or: [
                { username: req.body.username },
                { email: req.body.username },
            ]
        })
        if (data) {
            if (data.otpAuthObject.otp === req.body.otp && (new Date() - new Date(data.otpAuthObject.createdAt) < 600000)) {
                res.send({
                    result: "Done"
                })
            }
            else {
                res.status(400).send({
                    result: "Fail",
                    reason: "Invalid OTP or OTP Has Been Expired"
                })
            }
        }
        else {
            res.status(401).send({
                result: "Fail",
                reason: "Unauthorized Activity"
            })
        }
    } catch (error) {
        res.status(500).send({
            result: "Fail",
            reason: "Internal Server Error"
        })
    }
}

async function forgetPassword3(req, res) {
    try {
        let data = await User.findOne({
            $or: [
                { username: req.body.username },
                { email: req.body.username },
            ]
        })
        if (data) {
            if (schema.validate(req.body.password)) {
                bcrypt.hash(req.body.password, 12, async (error, hash) => {
                    if (error) {
                        res.status(500).send({
                            result: "Fail",
                            reason: "Internal Server Error During Password Encryption"
                        })
                    }
                    else {
                        data.password = hash
                        await data.save()
                        res.send({
                            result: "Done",
                            data: data,
                            message: "Password Has Been Reset SuccessFully"
                        })
                    }
                })
            }
            else {
                res.status(400).send({
                    result: "Fail",
                    reason: schema.validate(req.body.password, { details: true }).map(x => x.message.replaceAll("string", "Password"))
                })
            }
        }
        else {
            res.status(401).send({
                result: "Fail",
                reason: "Unauthorized Activity"
            })
        }
    } catch (error) {
        res.status(500).send({
            result: "Fail",
            reason: "Internal Server Error"
        })
    }
}

module.exports = {
    createRecord: createRecord,
    getRecord: getRecord,
    getSingleRecord: getSingleRecord,
    updateRecord: updateRecord,
    deleteRecord: deleteRecord,
    login: login,
    forgetPassword1: forgetPassword1,
    forgetPassword2: forgetPassword2,
    forgetPassword3: forgetPassword3,
}
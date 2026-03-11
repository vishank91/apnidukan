const Newsletter = require("../models/Newsletter")
const mailer = require("../mailer/index")

async function createRecord(req, res) {
    try {
        let data = new Newsletter(req.body)
        await data.save()
        res.send({
            result: "Done",
            data: data
        })

        mailer.sendMail({
            from: process.env.MAILER,
            to: data.email,
            subject: `Newsletter Subscription Confirmed : Team ${process.env.SITE_NAME}`,
            html: `
                            <tr>
                            <td style="background-color:#0b3d91; padding:20px; text-align:center;">
                                <h1 style="color:#ffffff; margin:0; font-size:24px;">${process.env.SITE_NAME}</h1>
                            </td>
                            </tr>
        
                            <tr>
                            <td style="padding:30px; color:#333333;">
                                <h2 style="color:#0b3d91; margin-top:0;">Subscription Confirmed 🎉</h2>
                                
                                <p style="font-size:16px; line-height:24px; margin:15px 0;">
                                Thank you for subscribing to the ${process.env.SITE_NAME} newsletter! You’re now part of our shopping community.
                                </p>

                                <p style="font-size:16px; line-height:24px; margin:15px 0;">
                                Get ready to receive exclusive offers, latest arrivals, seasonal discounts, and special deals delivered straight to your inbox.
                                </p>

                                <!-- Button -->
                                <div style="text-align:center; margin:30px 0;">
                                <a href="${process.env.SITE_URL}" style="display:inline-block; padding:12px 25px; background-color:#0b3d91; color:#ffffff; text-decoration:none; font-size:16px; border-radius:4px;">
                                    Start Shopping
                                </a>
                                </div>

                                <p style="font-size:14px; line-height:22px; color:#555555;">
                                If you did not subscribe to this newsletter, please ignore this email or contact our support team.
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
            arr = Object.keys(error.keyValue).map(key => [key, `This ${key} Has Been Already Registered With Us`])
        else
            arr = Object.keys(error?.errors).map(key => [key, error.errors[key].message])
        let errorMessage = Object.fromEntries(arr)

        res.status(Object.values(errorMessage).length ? 400 : 500).send({
            result: "Fail",
            reason: Object.values(errorMessage).length ? errorMessage : "Internal Server Error"
        })
    }
}

async function getRecord(req, res) {
    try {
        let data = await Newsletter.find().sort({ _id: -1 })
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
        let data = await Newsletter.findOne({ _id: req.params._id })
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
        let data = await Newsletter.findOne({ _id: req.params._id })
        if (data) {
            data.status = req.body.status ?? data.status
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
        res.status(500).send({
            result: "Fail",
            reason: "Internal Server Error"
        })
    }
}

async function deleteRecord(req, res) {
    try {
        let data = await Newsletter.findOne({ _id: req.params._id })
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


module.exports = {
    createRecord: createRecord,
    getRecord: getRecord,
    getSingleRecord: getSingleRecord,
    updateRecord: updateRecord,
    deleteRecord: deleteRecord,
}
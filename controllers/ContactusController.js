const Contactus = require("../models/Contactus")
const mailer = require("../mailer/index")

async function createRecord(req, res) {
    try {
        let data = new Contactus(req.body)
        await data.save()
        res.send({
            result: "Done",
            data: data
        })

        mailer.sendMail({
            from: process.env.MAILER,
            to: data.email,
            subject: `We’ve Received Your Query : Team ${process.env.SITE_NAME}`,
            html: `
                    <tr>
                    <td style="background-color:#0b3d91; padding:20px; text-align:center;">
                        <h1 style="color:#ffffff; margin:0; font-size:24px;">${process.env.SITE_NAME}</h1>
                    </td>
                    </tr>

                    <tr>
                        <td style="padding:30px; color:#333333;">
                            <h2 style="color:#0b3d91; margin-top:0;">Thank You for Contacting Us</h2>
                            
                            <p style="font-size:16px; line-height:24px; margin:15px 0;">
                            We have successfully received your query. Our support team is reviewing your message and will get back to you as soon as possible.
                            </p>

                            <p style="font-size:16px; line-height:24px; margin:15px 0;">
                            At ${process.env.SITE_NAME}, we value your time and aim to provide quick and helpful responses to all customer inquiries.
                            </p>

                            <div style="text-align:center; margin:30px 0;">
                            <a href="${process.env.SITE_URL}" style="display:inline-block; padding:12px 25px; background-color:#0b3d91; color:#ffffff; text-decoration:none; font-size:16px; border-radius:4px;">
                                Visit Our Store
                            </a>
                            </div>

                            <p style="font-size:14px; line-height:22px; color:#555555;">
                            If your matter is urgent, please feel free to reply to this email or contact our customer support directly.
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

        mailer.sendMail({
            from: process.env.MAILER,
            to: process.env.MAILER,
            subject: `New Contact Us Query Received : ${process.env.SITE_NAME}`,
            html: `
                    <tr>
                    <td style="background-color:#0b3d91; padding:20px; text-align:center;">
                        <h1 style="color:#ffffff; margin:0; font-size:24px;">${process.env.SITE_NAME}</h1>
                    </td>
                    </tr>

                    <tr>
                        <td style="padding:30px; color:#333333;">
                            <h2 style="color:#0b3d91; margin-top:0;">New Contact Us Submission</h2>

                            <p style="font-size:15px; line-height:22px; margin:15px 0;">
                            A new query has been submitted through the <strong>Contact Us</strong> form on your website.
                            </p>

                            <!-- Query Details Box -->
                            <div style="background-color:#f1f3f7; padding:20px; border-left:4px solid #0b3d91; margin:20px 0;">

                            <p style="margin:8px 0; font-size:14px;"><strong>Name:</strong> ${data.name}</p>
                            <p style="margin:8px 0; font-size:14px;"><strong>Email:</strong> ${data.email}</p>
                            <p style="margin:8px 0; font-size:14px;"><strong>Phone:</strong> ${data.phone}</p>
                            <p style="margin:8px 0; font-size:14px;"><strong>Subject:</strong> ${data.subject}</p>
                            <p style="margin:8px 0; font-size:14px;"><strong>Message:</strong><br>${data.message}</p>
                            <p style="margin:8px 0; font-size:14px;"><strong>Date:</strong><br>${data.createdAt}</p>

                            </div>

                            <p style="font-size:14px; line-height:22px; color:#555555;">
                            Please review the above details and respond to the customer as soon as possible.
                            </p>

                            <p style="font-size:14px; margin-top:30px;">
                            — This is an automated notification from ${process.env.SITE_NAME} website.
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
        let errorMessage = Object.fromEntries(Object.keys(error?.errors).map(key => [key, error.errors[key].message]))
        res.status(Object.values(errorMessage).length ? 400 : 500).send({
            result: "Fail",
            reason: Object.values(errorMessage).length ? errorMessage : "Internal Server Error"
        })
    }
}

async function getRecord(req, res) {
    try {
        let data = await Contactus.find().sort({ _id: -1 })
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
        let data = await Contactus.findOne({ _id: req.params._id })
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
        let data = await Contactus.findOne({ _id: req.params._id })
        if (data) {
            data.status = req.body.status ?? data.status
            await data.save()
            res.send({
                result: "Done",
                data: data
            })

            mailer.sendMail({
                from: process.env.MAILER,
                to: data.email,
                subject: `Your Query Has Been Resolved : Team ${process.env.SITE_NAME}`,
                html: `
                    <tr>
                    <td style="background-color:#0b3d91; padding:20px; text-align:center;">
                        <h1 style="color:#ffffff; margin:0; font-size:24px;">${process.env.SITE_NAME}</h1>
                    </td>
                    </tr>

                    <tr>
                        <td style="padding:30px; color:#333333;">
                            <h2 style="color:#0b3d91; margin-top:0;">Your Issue Has Been Resolved</h2>
                            
                            <p style="font-size:16px; line-height:24px; margin:15px 0;">
                            Dear ${data.name},
                            </p>

                            <p style="font-size:16px; line-height:24px; margin:15px 0;">
                            We’re happy to inform you that your recent query has been successfully reviewed and resolved by our support team.
                            </p>

                            <p style="font-size:16px; line-height:24px; margin:15px 0;">
                            We hope the solution provided meets your expectations. Your satisfaction is very important to us, and we truly appreciate your patience.
                            </p>

                            <div style="text-align:center; margin:30px 0;">
                            <a href="${process.env.SITE_URL}" style="display:inline-block; padding:12px 25px; background-color:#0b3d91; color:#ffffff; text-decoration:none; font-size:16px; border-radius:4px;">
                                Visit ${process.env.SITE_NAME}
                            </a>
                            </div>

                            <p style="font-size:15px; line-height:22px; color:#555555;">
                            If you have any further questions or need additional assistance, please feel free to reply to this email. Our team is always here to help you.
                            </p>

                            <p style="font-size:16px; margin-top:30px;">
                            Warm Regards,<br>
                            <strong style="color:#0b3d91;">Customer Support Team</strong><br>
                            ${process.env.SITE_NAME}
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
        let data = await Contactus.findOne({ _id: req.params._id })
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
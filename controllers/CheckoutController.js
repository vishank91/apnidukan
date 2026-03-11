const Checkout = require("../models/Checkout")
const mailer = require("../mailer/index")
const Razorpay = require("razorpay")


//Payment API
async function order(req, res) {
    try {
        const instance = new Razorpay({
            key_id: process.env.RPKEYID,
            key_secret: process.env.RPSECRETKEY,
        });

        const options = {
            amount: req.body.amount * 100,
            currency: "INR"
        };

        instance.orders.create(options, (error, order) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: "Something Went Wrong!" });
            }
            res.json({ data: order });
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error!" });
        console.log(error);
    }
}

async function verifyOrder(req, res) {
    try {
        var check = await Checkout.findOne({ _id: req.body.checkid })
        check.rppid = req.body.razorpay_payment_id
        check.paymentStatus = "Done"
        check.paymentMode = "Net Banking"
        await check.save()
        res.status(200).send({ result: "Done", message: "Payment SuccessFull" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error!" });
    }
}

async function createRecord(req, res) {
    try {
        let data = new Checkout(req.body)
        await data.save()

        let finalData = await Checkout.findOne({ _id: data._id })
            .populate("user", ["name", "username", "email", "phone"])
            .populate({
                path: "products.product",
                select: "name brand finalPrice stockQuantity stock pic",
                populate: {
                    path: "brand",
                    select: "-_id name"
                },
                options: {
                    slice: {
                        pic: 1
                    }
                }
            })
        res.send({
            result: "Done",
            data: finalData
        })

        mailer.sendMail({
            from: process.env.MAILER,
            to: data.deliveryAddress?.email,
            subject: `Your Order Has Been Successfully Placed : Team ${process.env.SITE_NAME}`,
            html: `
                    <tr>
                    <td style="background-color:#0b3d91; padding:20px; text-align:center;">
                        <h1 style="color:#ffffff; margin:0; font-size:24px;">${process.env.SITE_NAME}</h1>
                    </td>
                    </tr>

                    <tr>
                        <td style="padding:30px; color:#333333;">
                            <h2 style="color:#0b3d91; margin-top:0;">Thank You for Your Order!</h2>

                            <p style="font-size:16px; line-height:24px; margin:15px 0;">
                            Dear ${finalData.user.name},
                            </p>

                            <p style="font-size:16px; line-height:24px; margin:15px 0;">
                            We’re pleased to inform you that your order has been successfully placed. Our team is now processing it and will prepare it for shipment shortly.
                            </p>

                            <div style="background-color:#f1f3f7; padding:20px; border-left:4px solid #0b3d91; margin:25px 0;">
                            <p style="margin:8px 0; font-size:14px;"><strong>Order ID:</strong> ${data._id}</p>
                            <p style="margin:8px 0; font-size:14px;"><strong>Order Date:</strong> ${data.createdAt}</p>
                            <p style="margin:8px 0; font-size:14px;"><strong>Payment Method:</strong> ${data.paymentMode}</p>
                            <p style="margin:8px 0; font-size:14px;"><strong>Total Amount:</strong> ${data.total}</p>
                            </div>

                            <div style="text-align:center; margin:30px 0;">
                            <a href="${process.env.SITE_URL}/profile?option=Order" style="display:inline-block; padding:12px 25px; background-color:#0b3d91; color:#ffffff; text-decoration:none; font-size:16px; border-radius:4px;">
                                Track Your Order
                            </a>
                            </div>

                            <p style="font-size:15px; line-height:22px; color:#555555;">
                            You will receive another email once your order has been shipped. If you have any questions, feel free to reply to this email.
                            </p>

                            <p style="font-size:16px; margin-top:30px;">
                            Warm Regards,<br>
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
        let errorMessage = Object.fromEntries(Object.keys(error?.errors).map(key => [key, error.errors[key].message]))
        res.status(Object.values(errorMessage).length ? 400 : 500).send({
            result: "Fail",
            reason: Object.values(errorMessage).length ? errorMessage : "Internal Server Error"
        })
    }
}

async function getRecord(req, res) {
    try {
        let data = await Checkout.find()
            .populate("user", ["name", "username", "email", "phone"])
            .populate({
                path: "products.product",
                select: "name brand finalPrice stockQuantity stock pic",
                populate: {
                    path: "brand",
                    select: "-_id name"
                },
                options: {
                    slice: {
                        pic: 1
                    }
                }
            }).sort({ _id: -1 })
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

async function getUserRecord(req, res) {
    try {
        let data = await Checkout.find({ user: req.params.userid })
            .populate("user", ["name", "username", "email", "phone"])
            .populate({
                path: "products.product",
                select: "name brand finalPrice stockQuantity stock pic",
                populate: {
                    path: "brand",
                    select: "-_id name"
                },
                options: {
                    slice: {
                        pic: 1
                    }
                }
            }).sort({ _id: -1 })
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
        let data = await Checkout.findOne({ _id: req.params._id })
            .populate("user", ["name", "username", "email", "phone"])
            .populate({
                path: "products.product",
                select: "name brand finalPrice stockQuantity stock pic",
                populate: {
                    path: "brand",
                    select: "-_id name"
                },
                options: {
                    slice: {
                        pic: 1
                    }
                }
            })
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
        let data = await Checkout.findOne({ _id: req.params._id })
        if (data) {
            data.orderStatus = req.body.orderStatus ?? data.orderStatus
            data.paymentMode = req.body.paymentMode ?? data.paymentMode
            data.paymentStatus = req.body.paymentStatus ?? data.paymentStatus
            data.rppid = req.body.rppid ?? data.rppid
            await data.save()

            let finalData = await Checkout.findOne({ _id: data._id })
                .populate("user", ["name", "username", "email", "phone"])
                .populate({
                    path: "products.product",
                    select: "name brand finalPrice stockQuantity stock pic",
                    populate: {
                        path: "brand",
                        select: "-_id name"
                    },
                    options: {
                        slice: {
                            pic: 1
                        }
                    }
                })
            res.send({
                result: "Done",
                data: finalData
            })

            mailer.sendMail({
                from: process.env.MAILER,
                to: data.deliveryAddress?.email,
                subject: `Your Order Status Has Been Updated : Team ${process.env.SITE_NAME}`,
                html: `
                    <tr>
                    <td style="background-color:#0b3d91; padding:20px; text-align:center;">
                        <h1 style="color:#ffffff; margin:0; font-size:24px;">${process.env.SITE_NAME}</h1>
                    </td>
                    </tr>

                    <tr>
                        <td style="padding:30px; color:#333333;">
                            <h2 style="color:#0b3d91; margin-top:0;">Order Status Update</h2>

                            <p style="font-size:16px; line-height:24px; margin:15px 0;">
                            Dear ${finalData.user.name},
                            </p>

                            <p style="font-size:16px; line-height:24px; margin:15px 0;">
                            We would like to inform you that the status of your order has been updated.
                            </p>

                            <div style="background-color:#f1f3f7; padding:20px; border-left:4px solid #0b3d91; margin:25px 0;">
                            <p style="margin:8px 0; font-size:14px;"><strong>Order ID:</strong> ${data._id}</p>
                            <p style="margin:8px 0; font-size:14px;"><strong>Current Status:</strong> ${data.orderStatus}</p>
                            <p style="margin:8px 0; font-size:14px;"><strong>Updated On:</strong> ${data.updatedAt}</p>
                            </div>

                            <p style="font-size:15px; line-height:22px; color:#555555;">
                            Please click the button below to view more details about your order.
                            </p>

                            <div style="text-align:center; margin:30px 0;">
                            <a href="${process.env.SITE_URL}/profile?option=Order" style="display:inline-block; padding:12px 25px; background-color:#0b3d91; color:#ffffff; text-decoration:none; font-size:16px; border-radius:4px;">
                                View Order Details
                            </a>
                            </div>

                            <p style="font-size:15px; line-height:22px; color:#555555;">
                            If you have any questions regarding your order, feel free to reply to this email. We’re always happy to assist you.
                            </p>

                            <p style="font-size:16px; margin-top:30px;">
                            Warm Regards,<br>
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
            res.status(404).send({
                result: "Fail",
                reason: "Record Not Found"
            })
        }
    } catch (error) {
        let errorMessage = Object.fromEntries(Object.keys(error?.errors).map(key => [key, error.errors[key].message]))
        res.status(Object.values(errorMessage).length ? 400 : 500).send({
            result: "Fail",
            reason: Object.values(errorMessage).length ? errorMessage : "Internal Server Error"
        })
    }
}

async function deleteRecord(req, res) {
    try {
        let data = await Checkout.findOne({ _id: req.params._id })
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
    getUserRecord: getUserRecord,
    order: order,
    verifyOrder: verifyOrder
}
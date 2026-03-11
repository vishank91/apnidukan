const mongoose = require("mongoose")

const TestimonialSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User Id is Mendatory"]
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Product Id is Mendatory"]
    },
    message: {
        type: String,
        required: [true, "Message is Mendatory"]
    },
    star: {
        type: Number,
        required: [true, "Star is Mendatory"]
    }
}, { timestamps: true })

const Testimonial = mongoose.model("Testimonial", TestimonialSchema)
module.exports = Testimonial
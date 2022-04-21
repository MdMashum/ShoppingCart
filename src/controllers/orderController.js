const cartModel = require("../Models/cartModel")
const mongoose = require('mongoose')
const userModel = require("../Models/userModel")
const productModel = require("../Models/productModel")
const orderModel = require("../Models/orderModel")
const ObjectId = mongoose.Types.ObjectId

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    if (typeof value === 'number' && value.toString().trim().length === 0) return false
    return true;
}

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

const createOrder = async function (req, res) {
    try {
        let data = req.body
        let userId = req.params.userId

        let { cartId } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "req body can't be empty" })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "userId is not a valid objectId" })
        }
        if (!isValid(cartId)) {
            return res.status(400).send({ status: false, msg: "cardId is required" })
        }
        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, msg: "cartId is not a valid objectId" })
        }

        let userDetails = await userModel.findOne({ _id: userId })
        if (!userDetails) {
            return res.status(404).send({ status: false, msg: "user not exist with this userId" })
        }

        let cartDetails = await cartModel.findOne({ _id: cartId })
        if (!cartDetails) {
            return res.status(404).send({ status: false, msg: "please create cart first to place order" })
        }
        let totalQuantity = 0
        for (let i = 0; i < cartDetails.items.length; i++) {
            totalQuantity += cartDetails.items[i].quantity
        }

        let orderToBePlaced = {
            userId: userId,
            items: cartDetails.items,
            totalPrice: cartDetails.totalPrice,
            totalItems: cartDetails.totalItems,
            totalQuantity: totalQuantity
        }
        let order = await orderModel.create(orderToBePlaced)
        return res.status(201).send({ status: true, msg: "order placed successfully", data: order })

    }
    catch (error) {
        console.log("This is the error:", error.message)
        res.status(500).send({ msg: "server error", err: error })
    }
}

const updateOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body

        let { orderId, status } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "req body can't be empty" })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "userId is not a valid objectId" })
        }
        if (!isValid(orderId)) {
            return res.status(400).send({ status: false, msg: "orderId is required" })
        }
        if (!isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, msg: "orderId is not a valid objectId" })
        }
        if (!isValid(status)) {
            return res.status(400).send({ status: false, msg: "status is required" })
        }
        if (status != "cancelled") {
            return res.status(400).send({ status: false, msg: "you can only update your cancellation status" })
        }

        let userDetails = await userModel.findOne({ _id: userId })
        if (!userDetails) {
            return res.status(404).send({ status: false, msg: "user not exist for this userId" })
        }

        let orderDetails = await orderModel.findOne({ _id: orderId, isDeleted: false })
        if (!orderDetails) {
            return res.status(404).send({ status: false, msg: "no order exist with this orderId" })
        }
        if (orderDetails.cancellable != true) {
            return res.status(400).send({ status: false, msg: "this item can't be cancelled as it is not cancellable" })
        }
        if (orderDetails.status == 'completed') {
            return res.status(400).send({ status: false, msg: "your order has been completed so can't be cancelled" })
        }

        let updatedOrderDetails = await orderModel.findOneAndUpdate({ _id: orderId, isDeleted: false, cancellable: true, status: "pending" }, { $set: { status: status } }, { new: true })
        if (updatedOrderDetails) {
            return res.status(200).send({ status: true, msg: "your order has been cancelled", data: updatedOrderDetails })
        }
        else {
            return res.status(400).send({ status: false, msg: "your order is already cancelled" })
        }
    }
    catch (error) {
        console.log("This is the error:", error.message)
        res.status(500).send({ msg: "server error", err: error })
    }
}

module.exports = { createOrder, updateOrder }
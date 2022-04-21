const cartModel = require("../Models/cartModel")
const mongoose = require('mongoose')
const userModel = require("../Models/userModel")
const productModel = require("../Models/productModel")
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

const createCart = async function (req, res) {
    try {
        let data = req.body
        let userIdParams = req.params.userId
        let productId = req.body.items[0].productId


        let { userId, items, totalPrice, totalItems } = data
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "req body can't be empty,BAD REQUEST" })
        }
        if (!isValid(userId)) {
            return res.status(400).send({ status: false, msg: "userId is required" })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "userId is not a valid objectId" })
        }
        if (!isValidObjectId(userIdParams)) {
            return res.status(400).send({ status: false, msg: "userIdParams is not a valid objectId" })
        }
        if (!isValid(productId)) {
            return res.status(400).send({ status: false, msg: "productId is required" })
        }
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "productId is not a valid objectId" })
        }
        // if (Array.isArray(items)) {
        //     return res.status(400).send({ status: false, msg: "items is required and should be in array" })
        // }
        if (!(items[0].quantity)) {
            return res.status(400).send({ status: false, msg: "quantity is required" })
        }
        if (typeof (items[0].quantity) != typeof (1)) {
            return res.status(400).send({ status: false, msg: "quantity should be in number" })
        }

        let userDetails = await userModel.findOne({ _id: userId })
        if (!userDetails) {
            return res.status(400).send({ status: false, msg: "user not exist" })
        }

        let cartDetails = await cartModel.findOne({ userId: userId })
        if (!cartDetails) {
            let productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
            if (!productDetails) {
                return res.status(400).send({ status: false, msg: "product not exist or deleted" })
            }
            let totalPriceProduct = productDetails.price * items[0].quantity
            let totalItemsOfProduct = items.length
            let cartToBeCreated = { userId, items, totalItems: totalItemsOfProduct, totalPrice: totalPriceProduct }

            let createdCart = await cartModel.create(cartToBeCreated)
            return res.status(201).send({ status: true, msg: "cart created successfully", data: createdCart })
        }
        else {
            let productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
            if (!productDetails) {
                return res.status(404).send({ status: false, msg: "product not exist or deleted" })
            }

            amount = cartDetails.totalPrice + (productDetails.price * items[0].quantity)

            for (let i = 0; i < cartDetails.items.length; i++) {
                if (cartDetails.items[i].productId == items[0].productId) {
                    cartDetails.items[i].quantity = cartDetails.items[i].quantity + items[0].quantity
                    updateCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: cartDetails.items, totalPrice: amount }, { new: true })
                    return res.status(200).send({ status: true, msg: "product added to cart successfully", data: updateCart })
                }
            }
            let totalItemsOfProduct = items.length + cartDetails.totalItems
            let cart = await cartModel.findOneAndUpdate({ userId: userId }, { $addToSet: { items: { $each: items } }, totalPrice: amount, totalItems: totalItemsOfProduct }, { new: true })
            return res.status(201).send({ status: true, msg: "product added to cart successfully", data: cart })
        }

    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error.message })
    }
}
let updateCart = async function (req, res) {
    try {
        let data = req.body
        let userId = req.params.userId

        let { cartId, productId, removeProduct } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "for update req body cn't be empty" })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "userId is not a valid objectId" })
        }
        if (!isValid(cartId)) {
            return res.status(400).send({ status: false, msg: "cartId is required" })
        }
        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, msg: "cartId is not a valid objectId" })
        }
        if (!isValid(productId)) {
            return res.status(400).send({ status: false, msg: "productId is required" })
        }
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "productId is not a valid objectId" })
        }
        if (!(removeProduct == 0 || removeProduct == 1)) {
            return res.status(400).send({ status: false, msg: "removeProduct value should be either 0 or 1" })
        }

        let userDetails = await userModel.findOne({ _id: userId })
        if (!userDetails) {
            return res.status(404).send({ status: false, msg: "user not exist with this userId" })
        }
        let productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productDetails) {
            return res.status(404).send({ status: false, msg: "product not exist or deleted" })
        }
        let cartDetails = await cartModel.findOne({ _id: cartId })
        if (!cartDetails) {
            return res.status(400).send({ status: false, msg: "cart is not added for this cardId, create cart first" })
        }

        if (removeProduct == 1) {
            for (let i = 0; i < cartDetails.items.length; i++) {
                if (cartDetails.items[i].productId == productId) {
                    newPrice = cartDetails.totalPrice - productDetails.price
                    if (cartDetails.items[i].quantity > 1) {
                        cartDetails.items[i].quantity = cartDetails.items[i].quantity - 1
                        let updateCartDetails = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cartDetails.items, totalPrice: newPrice }, { new: true })
                        return res.status(200).send({ status: true, msg: "cart updated successfully", data: updateCartDetails })
                    }
                    else {
                        totalItem = cartDetails.totalItems - 1
                        cartDetails.items.splice(i, 1)

                        let updatedDetails = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cartDetails.items, totalPrice: newPrice, totalItems: totalItem }, { new: true })
                        return res.status(200).send({ status: true, msg: "cart removed successfully", data: updatedDetails })
                    }
                }
            }
        }

        if (removeProduct == 0) {
            for (let i = 0; i < cartDetails.items.length; i++) {
                if (cartDetails.items[i].productId == productId) {
                    let newPrice = cartDetails.totalPrice - (productDetails.price * cartDetails.items[i].quantity)
                    let totalItem = cartDetails.totalItems - 1
                    cartDetails.items.splice(i, 1)
                    let updatedCartDetails = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cartDetails.items, totalItems: totalItem, totalPrice: newPrice }, { new: true })
                    return res.status(200).send({ status: true, msg: "item removed successfully", data: updatedCartDetails })
                }
            }
        }

    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error.message })
    }
}

const getCartDetails = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "userID is not a valid objectId" })
        }

        let userDetails = await userModel.findOne({ _id: userId })
        if (!userDetails) {
            return res.status(404).send({ status: false, msg: "user not exist with this userId" })
        }
        let cartDetails = await cartModel.findOne({ userId: userId })
        if (!cartDetails) {
            return res.status(404).send({ status: false, msg: "cart not exist for this userId" })
        }
        else {
            return res.status(200).send({ status: true, msg: "cart with product details", data: cartDetails })
        }

    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error.message })
    }
}

const deleteCart = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "userID is not a valid objectId" })
        }

        let userDetails = await userModel.findOne({ _id: userId })
        if (!userDetails) {
            return res.status(404).send({ status: false, msg: "user not exist with this userId" })
        }
        let cartDetails = await cartModel.findOne({ userId: userId })
        if (!cartDetails) {
            return res.status(404).send({ status: false, msg: "cart not exist for this userId" })
        }
        else {
            let deleteCartDetails = await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalPrice: 0, totalItems: 0 }, { new: true })
            return res.status(204).send({ status: true, msg: "cart is deleted", data: deleteCartDetails })
        }

    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error.message })
    }
}


module.exports = { createCart, updateCart, getCartDetails, deleteCart }

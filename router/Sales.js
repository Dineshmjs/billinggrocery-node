const sales = require('express').Router()
const salesSchema = require('../schema/sales/Sales')
const tempItem = require('../schema/purches/TempItems')
const productSchema = require('../schema/Product')


sales.get("/", async (req, res) => {
    const findSales = await salesSchema.find()
    res.send(findSales)
})

sales.post("/", async (req, res) => {
    const items = await tempItem.find()

    const { address, payment, invoiceNo, invoiceDate } = req.body

    var x, newAvailable;
    var total = 0;
    const count = items.length
    var loopcount = 0

    for (x of items) {
        const type = x.type
        var available = await productSchema.findOne({ product: x.product })
        if (type === "ml" || type === "g") {
            newAvailable = available.qt - (x.qt / 1000)
        }
        if (type === "pkt" || type === "kg" || type === "l" || type === "nos") {
            newAvailable = available.qt - x.qt
        }

        console.log("newAvailable", newAvailable)

        var update = {
            $set: {
                qt: newAvailable
            }
        }

        var find = { product: x.product }
        const updateProduct = await productSchema.updateOne(find, update)

        total += x.total


        loopcount += 1

    }

    // console.log(loopcount, count)


    if (count > 0) {
        if (loopcount === count) {
            const insert = {
                address: address,
                invoicedate: invoiceDate,
                invoiceno: invoiceNo,
                payment: payment,
                items: items,
                total: total,

            }


            console.log(insert)


            const InsertData = await new salesSchema(insert)
            await InsertData.save(async (err, doc) => {
                if (err) {
                    res.status(404).send(err)
                }
                if (res) {
                    res.status(200).send(doc)
                    await tempItem.deleteMany({})
                }
            })

        }
    }



})

sales.delete("/", async (req, res) => {
    const { id } = req.query
    const findBill = await salesSchema.findOne({ _id: id })

    //update Product Available

    const items = findBill.items
    var x, count = 0, length = items.length, newAvailable;
    // console.log(findBill, items)

    for (x of items) {
        var available = await productSchema.findOne({ product: x.product })
        var type = x.type
        if (type === "ml" || type === "g") {
            newAvailable = available.qt + (x.qt / 1000)
        }
        if (type === "pkt" || type === "kg" || type === "l" || type === "nos") {
            newAvailable = available.qt + x.qt
        }

        var update = {
            $set: {
                qt: newAvailable
            }
        }
        var find = { product: x.product }
        const updateProduct = await productSchema.updateOne(find, update)
        // console.log(update)
        count += 1


    }

    // console.log(count, length)

    if (count === length) {
        const deleteBill = await salesSchema.deleteOne({ _id: id })
        // console.log(deleteBill)

        if (deleteBill) {
            res.status(200).send(deleteBill)
        }
    }



})

sales.post("/tempItems", async (req, res) => {

    const { gst, rate, type, qt, ...restBody } = req.body

    var taxableamount;

    if (type === "g" || type === "ml") {
        taxableamount = (qt / 1000) * rate
    }

    if (type === "pkt" || type === "kg" || type === "l" || type === "nos") {
        taxableamount = rate * qt
    }

    // const taxableamount = rate 
    const numGst = Number(gst)
    const gstamount = taxableamount * (numGst / 100)
    const total = taxableamount + gstamount

    const insertValues = {
        gst: numGst,
        rate: rate,
        taxableamount: taxableamount,
        type: type,
        qt: qt,
        gstamount: gstamount,
        total: total,
        ...restBody
    }

    console.log(req.body)





    console.log(insertValues)





    const insert = await new tempItem(insertValues)
    console.log(insert)

    await insert.save((err, doc) => {
        if (err) {
            console.log(err)
            res.status(404).send(err)
        }
        if (doc) {
            res.status(200).send(doc)
            // updateProducts()
        }
    })

})

sales.get("/tempItems", async (req, res) => {
    const get = await tempItem.find()
    res.status(200).send(get)
})

sales.put("/tempItems", async (req, res) => {

})

sales.delete("/tempItems", async (req, res) => {
    const deleteItem = await tempItem.deleteOne({ _id: req.query.id })
    res.status(200).send(deleteItem)

})


module.exports = sales
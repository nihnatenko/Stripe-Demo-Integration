const express = require("express");
const Process = require("process");
const router = express.Router();
require("dotenv").config();
const stripe = require('stripe')(Process.env.STRIPE_KEY);

// Create a customer
router.post("/addCustomer", async (request, response) => {
    console.log("Request body:", request.body);
    try {
        const customer = await stripe.customers.create(
            {
                email: request.body.email,
            }
        );
        return response.status(200).send({
            customerId: customer.id,
            customerEmail: customer.email,
        });
    } catch (error) {
        return response.status(400).send({ Error: error.raw.message });
    }
});

// Add a card
router.post("/addCard", async (request, response) => {
    console.log("Request body:", request.body);
    const {
        cardNumber,
        cardExpMonth,
        cardExpYear,
        cardCVC,
        cardName,
        country,
        postal_code,
    } = request.body;
    try {
        const cardToken = await stripe.tokens.create({
            card: {
                name: cardName,
                number: cardNumber,
                exp_month: cardExpMonth,
                exp_year: cardExpYear,
                cvc: cardCVC,
                address_country: country,
                address_zip: postal_code,
            },
        });

        const card = await stripe.customers.createSource(process.env.CUSTOMER_ID, {
            source: `${cardToken.id}`,
        });

        return response.status(200).send({
            card: card.id,
        });
    } catch (error) {
        return response.status(400).send({
            Error: error.raw.message,
        });
    }
});

// Get List of customer cards
router.get("/viewListOfCards", async (request, response) => {
    let cards = [];
    try {
        const savedCards = await stripe.customers.listSources(process.env.CUSTOMER_ID, {
            object: "card",
        });
        const cardDetails = Object.values(savedCards.data);

        cardDetails.forEach((cardData) => {
            let obj = {
                cardId: cardData.id,
                cardType: cardData.brand,
                cardExpDetails: `${cardData.exp_month}/${cardData.exp_year}`,
                cardLast4: cardData.last4,
            };
            cards.push(obj);
        });
        return response.status(200).send({
            cardDetails: cards,
        });
    } catch (error) {
        return response.status(400).send({
            Error: error.raw.message,
        });
    }
});

// Delete a card
router.post("/deleteCard", async (request, response) => {
    console.log("Request body:", request.body);
    const { cardId } = request.body;
    if (!cardId) {
        return response.status(400).send({
            Error: "CardId is missing",
        });
    }
    try {
        const deleteCard = await stripe.customers.deleteSource(process.env.CUSTOMER_ID, cardId);
        return response.status(200).send(deleteCard);
    } catch (error) {
        return response.status(400).send({
            Error: error.raw.message,
        });
    }
});

// Create a payment
router.post("/createCharge", async (request, response) => {
    console.log("Request body:", request.body);
    const { amount, cardId, email } = request.body;
        try {
            const createCharge = await stripe.charges.create({
                amount: amount,
                currency: "usd",
                receipt_email: email,
                customer: process.env.CUSTOMER_ID,
                card: cardId,
                description: `Stripe Charge With Amount ${amount}`,
            });
            if (createCharge.status === "succeeded") {
                return response.status(200).send({ Success: createCharge });
            } else {
                return response
                    .status(400)
                    .send({ Error: "Payment went wrong" });
            }
        } catch (error) {
            return response.status(400).send({
                Error: error.raw.message,
            });
        }
    });

module.exports = router;

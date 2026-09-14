import mongoose from "mongoose";

export interface IOrder {
    _id?: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    items: {
        grocery: mongoose.Types.ObjectId;
        name: string;
        price: string;
        unit: string;
        image: string;
        quantity: number;
    }[];
    isPaid: boolean;
    totalAmount: string;
    paymentMethod: "cod" | "online";
    address: {
        fullName: string;
        mobile: string;
        city: string;
        state: string;
        pincode: string;
        fullAddress: string;
        latitude: number;
        longitude: number;
    };
    assignment?: mongoose.Types.ObjectId | null;
    assignedDeliveryBoy?: mongoose.Types.ObjectId | null;
    status: "pending" | "out of delivery" | "delivered";
    deliveryOtp: string | null;
    deliveryOtpVerification: boolean;
    deliveredAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const orderSchema = new mongoose.Schema<IOrder>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [
            {
                grocery: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Grocery",
                    required: true,
                },
                name: { type: String, required: true },
                price: { type: String, required: true },
                unit: { type: String, default: "1 kg" },
                image: { type: String, default: "" },
                quantity: { type: Number, required: true, default: 1 },
            },
        ],
        isPaid: {
            type: Boolean,
            default: false,
        },
        totalAmount: {
            type: String,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ["cod", "online"],
            default: "cod",
        },
        address: {
            fullName: { type: String, required: true },
            mobile: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true },
            fullAddress: { type: String, required: true },
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
        },
        assignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DeliveryAssignment",
            default: null,
        },
        assignedDeliveryBoy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "out of delivery", "delivered"],
            default: "pending",
        },
        deliveryOtp: {
            type: String,
            default: null,
        },
        deliveryOtpVerification: {
            type: Boolean,
            default: false,
        },
        deliveredAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);

export default Order;
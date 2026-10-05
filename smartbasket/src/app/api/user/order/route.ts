import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Order from "@/models/order.model";
import Cart from "@/models/cart.model";

import { NextRequest, NextResponse } from "next/server";
import emitEventHandler from "@/lib/emitEventHandler";
import { auth } from "@/auth";
import { calcTotals } from "@/lib/cart";
import { releaseStock, reserveStock, validateCartAgainstStock } from "@/lib/stock";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Please log in to place an order" },
                { status: 401 }
            );
        }

        const { items, paymentMethod, address, paymentProof } = await req.json();
        const userId = session.user.id;

        const missing = Object.entries({ items: items?.length, paymentMethod, address })
            .filter(([, value]) => !value)
            .map(([key]) => key);

        if (missing.length > 0) {
            return NextResponse.json(
                { message: `Missing required order fields: ${missing.join(", ")}` },
                { status: 400 }
            );
        }

        const rawPhone = typeof address === "object" ? (address?.mobile || address?.phone) : null;
        const cleanPhone = String(rawPhone || "").replace(/[\s\-]/g, "").trim();

        const pakMobileRegex = /^03(?:0[0-9]|1[0-8]|2[0-5]|3[1-7]|4[0-9]|55)\d{7}$/;
        const isRepeatedDigits = /^03(\d)\1{8}$/.test(cleanPhone);

        if (!cleanPhone || !pakMobileRegex.test(cleanPhone) || isRepeatedDigits) {
            return NextResponse.json(
                { message: "Invalid Pakistani phone number. Please provide a valid mobile number (e.g., 03001234567)." },
                { status: 400 }
            );
        }

        if (paymentMethod === "online" && !paymentProof) {
            return NextResponse.json(
                { message: "Upload a screenshot of your transaction to place an online order" },
                { status: 400 }
            );
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const checked = await validateCartAgainstStock(items);
        if ("error" in checked) {
            return NextResponse.json({ message: checked.error }, { status: 409 });
        }
        const { lines } = checked;
        const { finalTotal } = calcTotals(lines);

        const reserved = await reserveStock(lines);
        if (!reserved.ok) {
            return NextResponse.json({ message: reserved.error }, { status: 409 });
        }

        try {
            const newOrder = await Order.create({
                user: userId,
                items: lines,
                paymentMethod,
                totalAmount: String(finalTotal),
                address,
                paymentProof: paymentMethod === "online" ? paymentProof : null,
            });

            await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

            await emitEventHandler("new-order", newOrder);

            return NextResponse.json(newOrder, { status: 201 });
        } catch (error) {
            await releaseStock(lines);
            throw error;
        }

    } catch (error: any) {
        return NextResponse.json(
            { message: `Place order error: ${error.message || error}` },
            { status: 500 }
        );
    }
}
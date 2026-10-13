
import connectDb from "@/lib/db";
import Grocery from "@/models/grocery.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();

    const groceries = await Grocery.find({
      isAvailable: true,
    })
      .select("_id name title category price image images")
      .limit(500)
      .lean();

    return NextResponse.json(
      {
        items: groceries,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get groceries error:", error);

    return NextResponse.json(
      { message: "Failed to load groceries" },
      { status: 500 }
    );
  }
}

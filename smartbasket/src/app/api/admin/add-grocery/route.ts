import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Grocery from "@/models/grocery.model";
import { uploadOnCloudinary } from "@/lib/cloudinary"; 
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    
    // Check Session & Admin Role
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json(
        { message: "you are not admin" },
        { status: 400 }
      );
    }

    // Get Form Data
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const unit = formData.get("unit") as string;
    const price = formData.get("price") as string;
    const file = formData.get("image") as Blob | null;

    // Upload Image to Cloudinary
    let imageUrl = "";
    if (file) {
      const uploadedUrl = await uploadOnCloudinary(file);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    // Create Grocery Item in Database
    const grocery = await Grocery.create({
      name,
      price,
      category,
      unit,
      image: imageUrl,
    });

    return NextResponse.json(grocery, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { message: `add grocery error ${error}` },
      { status: 500 }
    );
  }
}


import connectDb from "../../../../lib/db";
import User from "../../../../models/user.model";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/password";
import { NextRequest, NextResponse } from "next/server";

const PAKISTAN_CITIES = [
  "Islamabad",
  "Rawalpindi",
  "Lahore",
  "Karachi",
  "Peshawar",
  "Quetta",
  "Multan",
  "Faisalabad",
  "Gujranwala",
  "Sialkot",
  "Hyderabad",
  "Abbottabad",
  "Bahawalpur",
  "Sargodha",
  "Sukkur",
  "Mardan",
  "Muzaffarabad",
  "Gilgit",
  "Skardu",
];

const ALLOWED_VEHICLE_TYPES = ["Bike", "Bicycle", "Other"];

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const {
      name,
      email,
      password,
      mobile,
      role,
      cnicNumber,
      vehicleType,
      vehicleNumber,
      deliveryArea,
    } = await req.json();

    console.log("REGISTER API RECEIVED ROLE:", role);

    // Required fields check
    if (!name || !email || !password || !mobile || !role) {
      return NextResponse.json(
        { message: "Please fill all required fields." },
        { status: 400 }
      );
    }

    // Allowed roles check
    const allowedRoles = ["user", "shopkeeper", "deliveryBoy"];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { message: "Invalid role selected." },
        { status: 400 }
      );
    }

    // Validate name
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 60 ||
      !/^[\p{L}][\p{L}\s'-]{1,59}$/u.test(name.trim())
    ) {
      return NextResponse.json(
        { message: "Enter a valid name (2-60 characters)." },
        { status: 400 }
      );
    }

    // Normalize and validate email
    if (typeof email !== "string" || email.trim().length > 254) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Pakistani mobile number only: 03XXXXXXXXX
    // Exactly 11 digits, starts with 03.
    // Rejects numbers like 1233445656 and 055555555.
    if (typeof mobile !== "string" || !/^03[0-9]{9}$/.test(mobile)) {
      return NextResponse.json(
        {
          message:
            "Enter a valid Pakistani mobile number, e.g. 03333333333.",
        },
        { status: 400 }
      );
    }
if (
  typeof password !== "string" ||
  password.length < 8 ||
  password.length > 12 ||
  !/[A-Za-z]/.test(password)
) {
  return NextResponse.json(
    {
      message:
        "Password must be 8–12 characters long and contain at least one letter.",
    },
    { status: 400 }
  );
}
    // Existing password validation remains unchanged.
    const strengthError = validatePassword(password);

    if (strengthError) {
      return NextResponse.json(
        { message: strengthError },
        { status: 400 }
      );
    }

    // CNIC for shopkeeper and delivery boy only.
    // Accepts 13 digits or standard format 12345-1234567-1.
    let cleanCnic = "";

    if (role !== "user") {
      if (typeof cnicNumber !== "string") {
        return NextResponse.json(
          { message: "CNIC is required." },
          { status: 400 }
        );
      }

      if (
        !/^(?:[0-9]{13}|[0-9]{5}-[0-9]{7}-[0-9])$/.test(
          cnicNumber.trim()
        )
      ) {
        return NextResponse.json(
          {
            message:
              "CNIC must contain 13 digits, e.g. 12345-1234567-1.",
          },
          { status: 400 }
        );
      }

      cleanCnic = cnicNumber.replace(/-/g, "");
    }

    // Delivery boy required fields
    if (role === "deliveryBoy") {
      if (
        typeof vehicleType !== "string" ||
        typeof vehicleNumber !== "string" ||
        typeof deliveryArea !== "string"
      ) {
        return NextResponse.json(
          {
            message:
              "Vehicle type, vehicle number and delivery area are required.",
          },
          { status: 400 }
        );
      }

      // Only permitted vehicle types
      if (!ALLOWED_VEHICLE_TYPES.includes(vehicleType.trim())) {
        return NextResponse.json(
          { message: "Invalid vehicle type selected." },
          { status: 400 }
        );
      }

      // Vehicle registration number:
      // 2-15 characters, letters/numbers/spaces/hyphens.
      // Must contain at least one letter and one digit.
      const cleanVehicleNumber = vehicleNumber.trim().toUpperCase();

      if (
        cleanVehicleNumber.length < 2 ||
        cleanVehicleNumber.length > 15 ||
        !/^[A-Z0-9 -]+$/.test(cleanVehicleNumber) ||
        !/[A-Z]/.test(cleanVehicleNumber) ||
        !/[0-9]/.test(cleanVehicleNumber)
      ) {
        return NextResponse.json(
          { message: "Enter a valid vehicle registration number." },
          { status: 400 }
        );
      }

      // Only cities from the approved Pakistan city list
      const matchedCity = PAKISTAN_CITIES.find(
        (city) =>
          city.toLowerCase() === deliveryArea.trim().toLowerCase()
      );

      if (!matchedCity) {
        return NextResponse.json(
          {
            message:
              "Please select a valid city from the Pakistani cities list.",
          },
          { status: 400 }
        );
      }
    }

    // Check duplicate email
    const existUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existUser) {
      return NextResponse.json(
        { message: "User already exists! Please login." },
        { status: 400 }
      );
    }

    // Check duplicate Pakistani mobile
    const existMobile = await User.findOne({
      mobile,
    });

    if (existMobile) {
      return NextResponse.json(
        { message: "PLease enter a valid mobile number" },
        { status: 400 }
      );
    }

    // Check duplicate CNIC for non-customer roles
    if (role !== "user") {
      const existCnic = await User.findOne({
        cnicNumber: cleanCnic,
      });

      if (existCnic) {
        return NextResponse.json(
          { message: "This CNIC is already registered." },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Save selected role and relevant details
    console.log("REGISTER API HIT");
    console.log("ROLE:", role);
    console.log("CNIC:", cleanCnic);
    console.log("USER MODEL FIELDS:", Object.keys(User.schema.paths));

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      mobile,
      role,
      ...(role !== "user" && {
        cnicNumber: cleanCnic,
      }),
      ...(role === "deliveryBoy" && {
        vehicleType: vehicleType.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        deliveryArea: PAKISTAN_CITIES.find(
          (city) =>
            city.toLowerCase() === deliveryArea.trim().toLowerCase()
        ),
      }),
    });

    console.log("REGISTER API SAVED ROLE:", user.role);

    // Do not return the password hash to the browser
    const safeUser = user.toObject();
    delete safeUser.password;

    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    console.error("REGISTER API ERROR:", error);

    return NextResponse.json(
      { message: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}

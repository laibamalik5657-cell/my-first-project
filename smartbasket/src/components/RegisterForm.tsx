
"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  EyeIcon,
  EyeOff,
  Leaf,
  Loader2,
  Lock,
  LogIn,
  Mail,
  User,
  Phone,
  IdCard,
  Bike,
  MapPin,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import GoogleSignInButton from "./GoogleSignInButton";
import axios from "axios";
import Link from "next/link";

type Role = "user" | "shopkeeper" | "deliveryBoy";

type PropType = {
  previousStep?: (s: number) => void;
};
const pakistanCities = [
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

function RegisterForm({ previousStep }: PropType) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [cnic, setCnic] = useState("");
  const [vehicleType, setVehicleType] = useState("Bike");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500";

const cleanMobile = mobile.replace(/\D/g, "")
const cleanCnic = cnic.replace(/\D/g, "")

// Pakistani local mobile format: 03XXXXXXXXX
const isValidPakistaniMobile = /^03[0-9]{9}$/.test(cleanMobile)

// CNIC format: 12345-1234567-1
const isValidPakistaniCnic = /^\d{5}-\d{7}-\d{1}$/.test(cnic.trim())

// Vehicle registration input ki length aur allowed characters
const isValidVehicleNumber =
  vehicleNumber.trim().length >= 2 &&
  vehicleNumber.trim().length <= 15 &&
  /^[A-Za-z0-9 -]+$/.test(vehicleNumber.trim())

// Naam: letters, spaces, apostrophe aur hyphen
const isValidName =
  name.trim().length >= 2 &&
  name.trim().length <= 60 &&
  /^[A-Za-zÀ-ÿ\s'-]+$/.test(name.trim())
  const isValidEmail =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
  email.trim().length <= 254

 const formValidation =
  isValidName &&
 isValidEmail &&
  mobile === cleanMobile &&
  isValidPakistaniMobile &&
password.length >= 8 &&
password.length <= 12 &&
/[A-Za-z]/.test(password) &&
  password === confirmPassword &&
  (role === "user" || isValidPakistaniCnic) &&
  (role !== "deliveryBoy" ||
    (
      vehicleType.trim() !== "" &&
      isValidVehicleNumber &&
      deliveryArea.trim() !== ""
    ))
    console.log({
  name: isValidName,
  email: isValidEmail,
  mobile: isValidPakistaniMobile,
  mobileDigitsOnly: mobile === cleanMobile,
  passwordLength: password.length >= 8 && password.length <= 12,
  passwordHasLetter: /[A-Za-z]/.test(password),
  passwordsMatch: password === confirmPassword,
  cnic: role === "user" || isValidPakistaniCnic,
  vehicle: role !== "deliveryBoy" || isValidVehicleNumber,
  deliveryArea: role !== "deliveryBoy" || deliveryArea.trim() !== "",
  formValidation,
});

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    console.log("REGISTER BUTTON CLICKED");
    console.log("CURRENT ROLE:", role);

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
if (!isValidName) {
  setError("Enter a valid name using 2–60 letters, spaces, apostrophes or hyphens.")
  return
}

if (!isValidPakistaniMobile) {
  setError("Enter a valid Pakistani mobile number, e.g. 03001234567.")
  return
}

if (role !== "user" && !isValidPakistaniCnic) {
  setError("Enter a valid 13-digit CNIC in 12345-1234567-1 format.")
  return
}

if (role === "deliveryBoy" && !isValidVehicleNumber) {
  setError("Enter a valid vehicle registration number, maximum 15 characters.")
  return
}
    if (!/^\d{11}$/.test(mobile.replace(/\D/g, ""))) {
      setError("Enter a valid 11-digit mobile number.");
      return;
    }

    if (role !== "user" && !/^\d{13}$/.test(cleanCnic)) {
      setError("Enter a valid 13-digit CNIC number.");
      return;
    }

    if (
      role === "deliveryBoy" &&
      (!vehicleType || !deliveryArea.trim())
    ) {
      setError("Please enter your vehicle type and delivery area.");
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.replace(/\D/g, ""),
        password,
        role,
        ...(role !== "user" && {
          cnicNumber: cleanCnic,
        }),
        ...(role === "deliveryBoy" && {
          vehicleType,
          vehicleNumber: vehicleNumber.trim(),
          deliveryArea: deliveryArea.trim(),
        }),
      };

      console.log("ROLE BEING SENT TO API:", registrationData.role);
      console.log("REGISTRATION DATA:", registrationData);

      const response = await axios.post(
        "/api/auth/register",
        registrationData
      );

      console.log("REGISTRATION RESPONSE:", response.data);
      console.log(
        "ROLE SAVED BY API:",
        response.data?.user?.role
      );

      if (response.status >= 200 && response.status < 300) {
        const callbackUrl = new URLSearchParams(
          window.location.search
        ).get("callbackUrl");

        const safeCallbackUrl =
          callbackUrl?.startsWith("/") &&
          !callbackUrl.startsWith("//") &&
          callbackUrl !== "/unauthorized"
            ? callbackUrl
            : "/";

        router.push(
          `/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`
        );
      }
    } catch (err: unknown) {
      console.error("REGISTRATION ERROR:", err);

      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Registration failed. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white px-6 py-10">
      <button
        type="button"
        onClick={() => previousStep?.(1)}
        className="absolute left-6 top-6 flex items-center gap-2 text-green-700 transition-colors hover:text-green-800"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="font-medium">Back</span>
      </button>

      <motion.h1
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-2 mt-10 text-4xl font-extrabold text-green-700"
      >
        Create Account
      </motion.h1>

      <p className="mb-8 flex items-center gap-1 text-gray-800">
        Join SmartBasket today
        <Leaf className="h-5 w-5 text-green-500" />
      </p>

      <motion.form
        onSubmit={handleRegister}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <label className="text-sm font-semibold text-gray-700">
          Register As
        </label>

        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "user", label: "Customer", Icon: User },
            { value: "shopkeeper", label: "Shopkeeper", Icon: Store },
            { value: "deliveryBoy", label: "Delivery Boy", Icon: Bike },
          ].map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                const selectedRole = value as Role;

                setRole(selectedRole);
                setError("");

                console.log("SELECTED ROLE:", selectedRole);
              }}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-2 text-xs font-semibold transition ${
                role === value
                  ? "border-green-600 bg-green-50 text-green-800 ring-2 ring-green-100"
                  : "border-gray-200 text-gray-600 hover:border-green-400"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>

        <div className="relative">
          <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Your Name"
            autoComplete="name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="email"
            placeholder="Your Email"
            maxLength={54}
            autoComplete="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="relative">
          <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="tel"
            placeholder="Mobile Number (03XXXXXXXXX)"
            autoComplete="tel"
            maxLength={11}
            className={inputClass}
            value={mobile}
            onChange={(e) =>
              setMobile(e.target.value.replace(/\D/g, "").slice(0, 11))
            }
            required
          />
        </div>

        {role !== "user" && (
          <div className="relative">
            <IdCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="CNIC Number (12345-1234567-1)"
              inputMode="numeric"
              maxLength={15}
              className={inputClass}
              value={cnic}
              onChange={(e) => {
                const digits = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 13);

                const formatted =
                  digits.length > 5
                    ? digits.slice(0, 5) +
                      "-" +
                      digits.slice(5, 12) +
                      (digits.length > 12 ? "-" + digits.slice(12) : "")
                    : digits;
                setCnic(formatted);
              }}
              required
            />
          </div>
        )}

        {role === "deliveryBoy" && (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Vehicle Type
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="Bike">Bike</option>
                <option value="Car">Car</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="relative">
              <Bike className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
           <input
  type="text"
  placeholder="Vehicle Registration Number"
  maxLength={15}
  className={inputClass}
  value={vehicleNumber}
  onChange={(e) =>
    setVehicleNumber(
      e.target.value
        .replace(/[^A-Za-z0-9 -]/g, "")
        .slice(0, 12)
    )
  }
/>
            </div>

         
<div>
  <label className="mb-2 block text-sm font-medium text-gray-700">
    Delivery Area / City in Pakistan
  </label>

  <select
    value={deliveryArea}
    onChange={(e) => setDeliveryArea(e.target.value)}
    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
    required
  >
    <option value="">Select Pakistani City</option>

    {pakistanCities.map((city) => (
      <option key={city} value={city}>
        {city}
      </option>
    ))}
  </select>
</div>

          </>
        )}

        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
          
            autoComplete="new-password"
         placeholder="Password (8–12 characters)"
minLength={8}
maxLength={12}
            className={`${inputClass} pr-11`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-3.5 text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <EyeIcon size={20} />}
          </button>
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            autoComplete="new-password"
            className={`${inputClass} pr-11`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            aria-label={
              showConfirmPassword ? "Hide password" : "Show password"
            }
            className="absolute right-3 top-3.5 text-gray-500"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} />
            ) : (
              <EyeIcon size={20} />
            )}
          </button>
        </div>

        {role !== "user" && (
          <p className="rounded-xl bg-green-50 p-3 text-xs leading-5 text-green-800">
            Please provide accurate identity details. Entering a CNIC number
            does not itself verify your identity.
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!formValidation || loading}
          className="w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
        >
          {loading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            "Register"
          )}
        </button>

        <div className="relative my-2 flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-gray-300" />
          <span className="relative bg-white px-3 text-sm font-medium text-gray-400">
            OR
          </span>
        </div>
      </motion.form>

      <GoogleSignInButton />

      <p className="mt-6 flex flex-wrap items-center justify-center gap-1 text-sm text-gray-600">
        Already have an account?
        <LogIn className="h-4 w-4" />
        <Link href="/login" className="text-green-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default RegisterForm;

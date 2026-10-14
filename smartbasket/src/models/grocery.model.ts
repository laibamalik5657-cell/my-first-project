
import mongoose from "mongoose";

export interface IGrocery {
  _id?: mongoose.Types.ObjectId;
  name: string;
  category: string;
  price: string;
  unit: string;
  image: string;
  description?: string;
  stock: number;
  isAvailable: boolean;
  rating: number;
  numReviews: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const grocerySchema = new mongoose.Schema<IGrocery>(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Fruits & Vegetables",
        "Dairy & Eggs",
        "Rice, Atta & Grains",
        "Snacks & Biscuits",
        "Spices & Masalas",
        "Beverages & Drinks",
        "Personal Care",
        "Household Essentials",
        "Instant & Packaged Food",
        "Baby & Pet Care",
      ],
    },
    price: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      required: true,
       enum: [
    "kg", "g", "liter", "ml", "piece", "pack"
  ]
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
  
    isAvailable: {
      type: Boolean,
      default: true,
    },
  
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

grocerySchema.index({ isAvailable: 1, category: 1, createdAt: -1 })

const Grocery =
  mongoose.models.Grocery || mongoose.model("Grocery", grocerySchema);

export default Grocery;

import mongoose from "mongoose";

const RecipeSchema = new mongoose.Schema(
  {
    user: {
      type: String, // store user uid as a string
      required: true,
    },
    mealType: {
      type: String,
      required: true,
    },
    people: {
      type: Number,
      required: true,
    },
    cuisine1: {
      type: String,
      required: true,
    },
    cuisine2: {
      type: String,
      required: true,
    },
    dietaryConstraints: {
      type: [String],
      default: [],
    },
    prompt: {
      type: String,
      default: null,
    },
    generatedRecipe: {
      type: String,
      default: null,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    likes: {
      type: Array,
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model('Recipe', RecipeSchema);

import express from "express";
import Recipe from '../models/recipe.model.js';
import User from '../models/user.js';
import { bucket } from '../config/firebase.js';

const router = express.Router();

async function run(model, input) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/a41c307ccbbda2088dfa01260a21bd83/ai/run/${model}`,
    {
      headers: { Authorization: `Bearer sVDsrXpaBNvDePOosv25i1tYr-nXje2fM2632bZb` },
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
  return await response.json();
}

async function runImageGen(input) {
  console.error(JSON.stringify(input));
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/a41c307ccbbda2088dfa01260a21bd83/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
    {
      headers: { Authorization: `Bearer sVDsrXpaBNvDePOosv25i1tYr-nXje2fM2632bZb` },
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
  return response;
}

// Create a new recipe

router.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    // Fetch user details for each recipe manually
    const recipesWithUserData = await Promise.all(
      recipes.map(async (recipe) => {
        const user = await User.findOne({ uid: recipe.user }).select('username profilePicture');
        return {
          ...recipe.toObject(),
          user,
        };
      })
    );
    res.status(200).json(recipesWithUserData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { mealType, people, cuisine1, cuisine2, dietaryConstraints, user, prompt } = req.body;

  // Validate required fields
  if (!mealType || !people || !cuisine1 || !cuisine2 || !prompt) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const messages = [
      {
        role: 'system',
        content:
          'You are a polite and helpful assistant. Your job is to create an amazing fusion of two different types of cuisines from around the world into a single recipe.Keep the recipe simple and keep the ingredient list concise, no need to provide separate ingredient list for each part of the recipe. Incorporate the different flavor profiles and spices of the given cuisines. Be sure to follow the diet constraints if mentioned. Your output should contain a concise ingredient list and the recipe. Always structure your response in this exact format: [RECIPE_TITLE] {Recipe name in title case} [RECIPE_DESCRIPTION] {One paragraph describing the fusion concept} [RECIPE_INFO] Servings: {number} Cook Time: {minutes} minutes [INGREDIENTS] {List each ingredient on a new line with exact measurements: - quantity unit ingredient (extra details)} [INSTRUCTIONS] {Numbered list of steps, each on a new line: 1. Step one 2. Step two} [NOTES] {Optional cooking tips, substitutions, or serving suggestions} Example: [RECIPE_TITLE] Thai-Mexican Street Tacos [RECIPE_DESCRIPTION] A vibrant fusion that combines the bold flavors of Thai curry with traditional Mexican street tacos. [RECIPE_INFO] Servings: 4 Prep Time: 20 minutes Cook Time: 30 minutes [INGREDIENTS] - 12 corn tortillas - 500g chicken thigh, diced - 2 tbsp red curry paste - 1 cup coconut milk [INSTRUCTIONS] 1. Heat oil in a large pan over medium heat 2. Add curry paste and fry for 1 minute [NOTES] For extra heat, add Thai bird\'s eye chilies or jalapeños. Maintain this exact structure and formatting. Each section must start with the section header in square brackets. Keep ingredients and instructions clear and concise.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    // Call the Cloudflare AI API to generate the recipe content
    const cfResponse = await run('@cf/meta/llama-3-8b-instruct', {
      messages,
      max_tokens: 500,
    });

    // Here, cfResponse is assumed to contain the generated recipe.
    // Adjust the extraction based on the actual response structure.

    // Create and save the new recipe, including the generated content in the "prompt" field.
    const newRecipe = new Recipe({
      user,
      people,
      prompt,
      mealType,
      cuisine1,
      cuisine2,
      dietaryConstraints,
      generatedRecipe: cfResponse.result.response,
    });

    const savedRecipe = await newRecipe.save();
    res.status(201).json({ recipe: savedRecipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(id);

    // Find and delete the recipe
    const deletedRecipe = await Recipe.findByIdAndDelete(id);

    if (!deletedRecipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.status(200).json({ message: 'Recipe deleted successfully', deletedRecipe });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.status(200).json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const recipes = await Recipe.find({ user: userId }).sort({ createdAt: -1 });
    if (!recipes || recipes.length === 0) {
      return res.status(404).json({ message: 'No recipes found for this user' });
    }
    res.status(200).json(recipes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/gen-image', async (req, res) => {
  const { recipe } = req.body;

  // Validate required fields
  if (!recipe) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const prompt = `generate a realistic image for this recipe: ${recipe.generatedRecipe}`;

    // Call the Cloudflare AI API to generate the recipe content
    const image = await runImageGen({ prompt });


    if (!image.ok) {
      const errText = await image.text();
      throw new Error(`Cloudflare API error: ${image.status} ${errText}`);
    }

    // Get the image as a Buffer
    const arrayBuffer = await image.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Determine file extension from the content type (default to png)
    const contentType = image.headers.get('content-type') || 'image/png';
    let extension = '.png';
    if (contentType === 'image/jpeg') extension = '.jpg';
    else if (contentType === 'image/webp') extension = '.webp';

    // Define a unique file name within the 'generated-images' folder
    const fileName = `generated-images/${recipe._id}-${Date.now()}${extension}`;
    const file = bucket.file(fileName);

    // Upload the image buffer to Firebase Storage
    await file.save(imageBuffer, {
      metadata: { contentType },
    });

    // (Optional) Make the file public
    await file.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;


    const updatedRecipe = await Recipe.findByIdAndUpdate(
      recipe._id,
      { $set: { imageUrl } },
      { new: true }
    );

    if (!updatedRecipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const savedRecipe = await updatedRecipe.save();
    res.status(201).json({ recipe: updatedRecipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    if (recipe.likes.includes(userId)) {
      return res.status(400).json({ message: 'You already liked this recipe' });
    }

    recipe.likes.push(userId);
    await recipe.save();

    res.status(200).json({ message: 'Recipe liked successfully', likes: recipe.likes.length });
  } catch (error) {
    console.error('Error adding like:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;

const express = require('express');
//Her exporter vi alle de funktioner vi skal bruge
const { createActivity, getActivity, getProfile, createMetabolism, seeEnergi, profile, saveUser, checkProfile, saveChanges, deleteThisProfile, getIngredients, getNutritionalInfo, saveRecipe, getRecipes, getRecipeNutrition, saveMeal, getMealsByUserId, updateMealWeight, deleteMeal, logWater } = require('../controllers/user.js')

const router = express.Router();

//activity beregner
router.get('/user/Activitytable/:activityid', getActivity);

router.post('/user/Activities', createActivity);

//Stofskifte beregner
router.get('/user/profile/:userId', getProfile);

router.post('/user/metabolism', createMetabolism);

//Dailynutri energi
router.get('/user/meals/:userId', seeEnergi);

//brugerstyring
router.get('/user/profile/:userID', profile);

router.post('/user/profile/save_user', saveUser);

router.get('/user/profile', checkProfile);

router.put('/user/profile/edit/save_changes', saveChanges);

router.delete('/user/profile/delete', deleteThisProfile);

//Meal creator
router.get('/foodbank/food', getIngredients);

router.get('/foodbank/foodParameter', getNutritionalInfo);

router.post('/user/recipe', saveRecipe);

router.get('/user/recipe', getRecipes);

//Meal tracker
router.get('/user/recipe/:recipeId', getRecipeNutrition);

router.post('/user/meal', saveMeal);

router.get('/user/meal', getMealsByUserId);

router.put('/user/meal/:mealID', updateMealWeight);

router.delete('/user/meal/:mealID', deleteMeal);

router.post('/user/water', logWater)

module.exports = router;
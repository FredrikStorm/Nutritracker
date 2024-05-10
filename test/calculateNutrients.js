// calculateNutrients.js
function calculateTotalNutrients(items) {
    return items.reduce((totals, item) => {
      totals.calories += item.calories;
      totals.protein += item.protein;
      totals.fat += item.fat;
      totals.fiber += item.fiber;
      return totals;
    }, { calories: 0, protein: 0, fat: 0, fiber: 0 });
  }
  
  module.exports = calculateTotalNutrients;
  
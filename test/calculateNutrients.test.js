const chai = require('chai');
const expect = chai.expect;
const calculateTotalNutrients = require('./calculateNutrients.js');

describe('calculateTotalNutrients', () => {
  it('should correctly sum up all nutrients from a list of food items', () => {
    const testItems = [
      { calories: 150, protein: 10, fat: 5, fiber: 2 },
      { calories: 350, protein: 20, fat: 15, fiber: 5 }
    ];
    const expected = {
      calories: 500,
      protein: 30,
      fat: 20,
      fiber: 7
    };
    const result = calculateTotalNutrients(testItems);
    expect(result).to.deep.equal(expected);
  });
});



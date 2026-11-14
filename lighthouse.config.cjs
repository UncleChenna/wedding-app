module.exports = {
  extends: "lighthouse:default",
  settings: {
    onlyCategories: ["performance", "accessibility"],
    formFactor: "mobile",
    throttlingMethod: "simulate",
  },
};

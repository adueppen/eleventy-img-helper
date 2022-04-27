const respImgTransform = require("./transform");

const defaultOptions = {
  selectors: {
    "img": {}
  },
  postFunction: null,
  htmlFunction: null
}

module.exports = (eleventyConfig, options = defaultOptions) => {
  eleventyConfig.addTransform("responsive-images", async function (inputContent) {
    if (this.outputPath && this.outputPath.endsWith(".html")) {
      let processed = respImgTransform(inputContent, options, this.inputPath, this.outputPath);
      if (options.postFunction && typeof options.postFunction === "function")
        return processed.then(value => options.postFunction(value));
      else return processed;
    }
    return inputContent;
  })
}

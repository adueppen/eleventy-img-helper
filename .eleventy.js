const transform = require("./lib/transform");

module.exports = (eleventyConfig, options) => {
  eleventyConfig.addTransform("responsive-images", async function (inputContent) {
    if (this.outputPath && this.outputPath.endsWith(".html")) {
      let processed = transform(inputContent, options, this.inputPath, this.outputPath);
      if (options.postFunction && typeof options.postFunction === "function")
        return processed.then(value => options.postFunction(value));
      else return processed;
    }
    return inputContent;
  })
}

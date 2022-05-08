const {parseHTML} = require("linkedom");
const {compare} = require("specificity")
const deepmerge = require("deepmerge");
const eleventyImg = require("@11ty/eleventy-img");
const path = require("path");

module.exports = async function (inputContent, options, inputPath, outputPath) {
  let {document} = parseHTML(inputContent);
  for (const image of [...document.querySelectorAll("img")]) {
    const orderedOptions = Object.entries(options.selectors)
      .filter(([selector]) => image.matches(selector))
      .sort(([a], [b]) => compare(a, b))
      .map(([, selectorOptions]) => selectorOptions);
    const currentOptions = deepmerge.all([options, ...orderedOptions]);
    const isRemote = eleventyImg.Util.isRemoteUrl(image.src);
    const pageOutputDir = path.dirname(outputPath)
    const imagePath = isRemote ? image.src : path.resolve(path.dirname(inputPath), image.src);
    const outputDir = isRemote ? pageOutputDir : path.dirname(path.resolve(pageOutputDir, image.src));
    const urlPath = path.relative(path.dirname(outputPath), outputDir);
    const imageAttrs = Object.fromEntries(image.getAttributeNames().map(a => [a, image.getAttribute(a)]));
    const newImageMetadata = await eleventyImg(imagePath, {...currentOptions, outputDir, urlPath});
    const newImageTag = (currentOptions.htmlFunction && typeof currentOptions.htmlFunction === "function") ?
      currentOptions.htmlFunction(newImageMetadata, currentOptions, imageAttrs) :
      eleventyImg.generateHTML(newImageMetadata, {
        ...imageAttrs,
        sizes: currentOptions.sizes,
        loading: "lazy",
        decoding: "async"
      });
    image.replaceWith(parseHTML(newImageTag).document.firstElementChild);
  }
  return document.toString();
}

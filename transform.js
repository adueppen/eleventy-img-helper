const {parseHTML} = require("linkedom");
const deepmerge = require("deepmerge");
const eleventyImg = require("@11ty/eleventy-img");
const path = require("path");
const mergeFunction = (target, source) => source;

//TODO: make it so multiple selectors can apply to the same img and their options will be merged, with CSS specificity
// determining which takes precedence if duplicates. https://github.com/keeganstreet/specificity may be useful. making
// this work will require a significant rewrite
module.exports = async function (inputContent, options, inputPath, outputPath) {
  let {document} = parseHTML(inputContent);
  for (const [selector, selectorOptions] of Object.entries(options.selectors)) {
    const currentOptions = deepmerge(options, selectorOptions, {arrayMerge: mergeFunction});
    const images = [...document.querySelectorAll(selector)].filter(element => element.tagName.toLowerCase() === "img");
    for (const image of images) {
      let imagePath = path.resolve(path.parse(inputPath).dir, image.src);
      let urlPath = path.parse(image.src).dir;
      let outputDir = path.parse(outputPath).dir;
      let imageAttrs = Object.fromEntries(image.getAttributeNames().map(a => [a, image.getAttribute(a)]));
      let newImageMetadata = await eleventyImg(imagePath, {...currentOptions, outputDir, urlPath});
      let newImageTag = (currentOptions.htmlFunction && typeof currentOptions.htmlFunction === "function") ?
        currentOptions.htmlFunction(newImageMetadata, currentOptions, imageAttrs) :
        eleventyImg.generateHTML(newImageMetadata, {
          ...imageAttrs,
          sizes: currentOptions.sizes,
          loading: "lazy",
          decoding: "async"
        });
      image.replaceWith(parseHTML(newImageTag).document.firstElementChild);
    }
  }
  return document.toString();
}

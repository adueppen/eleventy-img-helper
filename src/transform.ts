import {parseHTML} from "linkedom";
import {compare} from "specificity";
import deepmerge from "deepmerge";
import eleventyImg, {BaseImageOptions, Metadata} from "@11ty/eleventy-img";
import * as path from "path";
import generateHTML from "@11ty/eleventy-img/generate-html";
const mergeFunction: deepmerge.Options["arrayMerge"] = (target, source) => source; //TODO: possibly offer a way to override this?

type ImageAttrs = Parameters<typeof generateHTML>[1]
type HtmlFunction = (metadata: Metadata, options: EleventyImgHelper.HelperOptions, attributes: ImageAttrs) => string;

declare namespace EleventyImgHelper {
  interface BaseHelperOptions extends BaseImageOptions {
    /**
     * Is `eleventy-img`'s `generateHTML` function not versatile enough for you? Pass in a custom function to
     * generate the HTML exactly the way you want.
     * @param metadata the Stats object from calling Image
     * @param options the set of options applied to this image
     * @param attributes the attributes on the original image tag
     * @return a HTML string for this image
     */
    htmlFunction?: HtmlFunction;

    /**
     * Directly specify the source size descriptors to be put in the `sizes` attribute in the resulting HTML.
     */
    sizes?: string;
  }

  interface HelperOptions extends BaseHelperOptions {
    /**
     * A function to run on the processed HTML before returning it. This is most useful for things like HTML
     * minification or other small transforms.
     * @param inputContent the HTML string that would normally be returned by the transform
     * @return a further transformed HTML string
     */
    postFunction?: (inputContent: string) => string;

    /**
     * The highlight feature of this plugin, this option is an object containing a list of CSS selectors paired with
     * another set of `eleventy-img`/plugin options. For each image tag in the input content, the selectors that
     * apply to it will have their options merged with the global options and then each other in order of CSS
     * specificity.
     */
    selectors?: {[selector: string]: BaseHelperOptions};
  }
}

let EleventyImgHelper = async function (
  inputContent: string,
  options: EleventyImgHelper.HelperOptions,
  inputPath: string,
  outputPath: string
): Promise<string> {
  let {document} = parseHTML(inputContent);
  for (const image of [...document.querySelectorAll("img")]) {
    let currentOptions: EleventyImgHelper.HelperOptions;
    if (options.selectors) {
      const orderedOptions = Object.entries(options.selectors)
        .filter(([selector]) => image.matches(selector))
        .sort(([a], [b]) => compare(a, b))
        .map(([, selectorOptions]) => selectorOptions);
      currentOptions = deepmerge.all([options, ...orderedOptions], {arrayMerge: mergeFunction});
    } else currentOptions = options;
    const isRemote = eleventyImg.Util.isRemoteUrl(image.src);
    const pageOutputDir = path.dirname(outputPath)
    const imagePath = isRemote ? image.src : path.resolve(path.dirname(inputPath), image.src);
    const outputDir = isRemote ? pageOutputDir : path.dirname(path.resolve(pageOutputDir, image.src));
    const urlPath = path.relative(path.dirname(outputPath), outputDir);
    const imageAttrs = Object.fromEntries(image.getAttributeNames().map((a: string) => [a, image.getAttribute(a)])) as ImageAttrs;
    const newImageMetadata = await eleventyImg(imagePath, {...currentOptions, outputDir, urlPath});
    const newImageTag = (currentOptions.htmlFunction && typeof currentOptions.htmlFunction === "function") ?
      currentOptions.htmlFunction(newImageMetadata, currentOptions, imageAttrs) :
      eleventyImg.generateHTML(newImageMetadata, {
        ...imageAttrs,
        sizes: currentOptions.sizes,
        loading: "lazy",
        decoding: "async"
      } as ImageAttrs);
    image.replaceWith(parseHTML(newImageTag).document.firstElementChild);
  }
  return document.toString();
}

export = EleventyImgHelper;
